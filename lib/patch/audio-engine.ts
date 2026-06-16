import type { Connection, Edge, Node } from "@xyflow/react";
import { ConnectionRegistry } from "./connection-registry";
import { parseHandle, isSourceHandle, isTargetHandle } from "./ports";
import {
  createRuntimeNode,
  type RuntimeNode,
} from "./runtime-nodes";
import type { PatchNodeData } from "./ports";
import { DEFAULT_TRANSPORT_BPM } from "./transport";

type Wire = {
  sourceId: string;
  sourceHandle: string;
  targetId: string;
  targetHandle: string;
  modDepth: number;
};

export class AudioEngine {
  readonly ctx: AudioContext;
  private nodes = new Map<string, RuntimeNode>();
  private registry = new ConnectionRegistry();
  private wires: Wire[] = [];
  private cvWireGains: GainNode[] = [];
  private masterAnalyser: AnalyserNode | null = null;
  private readonly scopeAnalyser: AnalyserNode;
  private scopeTapNodeId: string | null = null;
  private scopeTapSource: AudioNode | null = null;
  private running = false;
  private transportBpm = DEFAULT_TRANSPORT_BPM;

  constructor(ctx?: AudioContext) {
    this.ctx =
      ctx ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    this.scopeAnalyser = this.ctx.createAnalyser();
    this.scopeAnalyser.fftSize = 2048;
    this.scopeAnalyser.smoothingTimeConstant = 0.8;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get analyser(): AnalyserNode | null {
    if (this.scopeTapNodeId && this.scopeTapSource) {
      return this.scopeAnalyser;
    }
    return this.masterAnalyser;
  }

  setScopeTap(nodeId: string | null): void {
    this.scopeTapNodeId = nodeId;
    this.refreshScopeTap();
  }

  getTransportBpm(): number {
    return this.transportBpm;
  }

  setTransportBpm(bpm: number): void {
    this.transportBpm = Math.max(60, Math.min(200, bpm));
    const t = this.ctx.currentTime;
    for (const runtime of this.nodes.values()) {
      if (runtime.kind === "lfo") {
        runtime.setParams({ transportBpm: this.transportBpm }, t);
      }
    }
  }

  async resume(): Promise<void> {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  syncUiGraph(
    uiNodes: Node<PatchNodeData>[],
    uiEdges: Edge[]
  ): boolean {
    const uiIds = new Set(uiNodes.map((n) => n.id));
    let structureChanged = false;
    const newlyCreated = new Set<string>();

    for (const [id, runtime] of this.nodes) {
      if (!uiIds.has(id)) {
        structureChanged = true;
        runtime.dispose();
        this.nodes.delete(id);
      }
    }

    for (const uiNode of uiNodes) {
      const existing = this.nodes.get(uiNode.id);
      const params =
        uiNode.data.kind === "lfo"
          ? { ...uiNode.data.params, transportBpm: this.transportBpm }
          : uiNode.data.params;
      if (existing) {
        existing.setParams(params, this.ctx.currentTime);
      } else {
        structureChanged = true;
        const runtime = createRuntimeNode(
          this.ctx,
          uiNode.data.kind,
          uiNode.id,
          params
        );
        if (runtime) {
          this.nodes.set(uiNode.id, runtime);
          newlyCreated.add(uiNode.id);
        }
      }
    }

    this.wires = uiEdges.map((e) => ({
      sourceId: e.source,
      sourceHandle: e.sourceHandle ?? "audio-out",
      targetId: e.target,
      targetHandle: e.targetHandle ?? "audio-in",
      modDepth:
        typeof e.data?.modDepth === "number" ? e.data.modDepth : 1,
    }));

    this.registry.rebuild(
      this.wires.map((w) => ({ source: w.sourceId, target: w.targetId }))
    );

    this.reconnectAll();
    this.syncDetuneSources(uiNodes);

    if (structureChanged && this.running) {
      this.restartGenerators(newlyCreated);
    }

    const analyserNode = [...this.nodes.values()].find(
      (n) => n.kind === "analyser"
    );
    this.masterAnalyser =
      analyserNode && "analyser" in analyserNode
        ? (analyserNode as RuntimeNode & { analyser: AnalyserNode }).analyser
        : this.findOutputTap();

    this.refreshScopeTap();

    return structureChanged;
  }

  private refreshScopeTap(): void {
    if (this.scopeTapSource) {
      try {
        this.scopeTapSource.disconnect(this.scopeAnalyser);
      } catch {
        /* noop */
      }
      this.scopeTapSource = null;
    }

    if (!this.scopeTapNodeId) return;

    const runtime = this.nodes.get(this.scopeTapNodeId);
    const tap = runtime?.getTap();
    if (!tap) return;

    try {
      tap.connect(this.scopeAnalyser);
      this.scopeTapSource = tap;
    } catch {
      /* duplicate connection */
    }
  }

  /** Start generators added during a live topology change; leave running sources alone. */
  private restartGenerators(newlyCreated: Set<string>): void {
    const t = this.ctx.currentTime;
    for (const runtime of this.nodes.values()) {
      if (!newlyCreated.has(runtime.id)) continue;
      if (
        runtime.kind === "oscillator" ||
        runtime.kind === "detune" ||
        runtime.kind === "wavetable" ||
        runtime.kind === "fm" ||
        runtime.kind === "noise"
      ) {
        runtime.start(t);
      }
      if (runtime.kind === "lfo") {
        runtime.start(t);
      }
    }
    this.setGeneratorKeyGate(false);
  }

  private findOutputTap(): AnalyserNode | null {
    const output = [...this.nodes.values()].find((n) => n.kind === "output");
    if (!output) return null;
    const tap = output.getTap();
    if (!tap) return null;
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    try {
      tap.connect(analyser);
    } catch {
      /* tap may already be connected */
    }
    return analyser;
  }

  isValidConnection(connection: Connection): boolean {
    const source = parseHandle(connection.sourceHandle);
    const target = parseHandle(connection.targetHandle);
    if (!source || !target) return false;
    if (!isSourceHandle(connection.sourceHandle)) return false;
    if (!isTargetHandle(connection.targetHandle)) return false;
    if (source.signal === "audio" && target.signal !== "audio") return false;
    if (source.signal === "cv" && target.signal !== "cv") return false;
    if (source.signal === "trigger" && target.signal !== "trigger") return false;
    if (
      connection.source &&
      connection.target &&
      this.registry.wouldCycle(connection.source, connection.target)
    ) {
      return false;
    }
    return true;
  }

  private reconnectAll(): void {
    for (const gain of this.cvWireGains) {
      try {
        gain.disconnect();
      } catch {
        /* noop */
      }
    }
    this.cvWireGains = [];

    for (const runtime of this.nodes.values()) {
      try {
        const out = runtime.getOutput("audio-out") ?? runtime.getTap();
        out?.disconnect();
      } catch {
        /* noop */
      }
    }

    for (const wire of this.wires) {
      this.applyWire(wire);
    }

    const output = [...this.nodes.values()].find((n) => n.kind === "output");
    if (output) {
      const outGain = output.getInput("audio-in");
      if (outGain) {
        try {
          outGain.connect(this.ctx.destination);
        } catch {
          /* already connected */
        }
      }
    }
  }

  private syncDetuneSources(uiNodes: Node<PatchNodeData>[]): void {
    for (const uiNode of uiNodes) {
      if (uiNode.data.kind !== "detune" && uiNode.data.kind !== "unison") continue;

      const runtime = this.nodes.get(uiNode.id);
      if (!runtime?.syncSource) continue;

      const inWire = this.wires.find(
        (w) => w.targetId === uiNode.id && w.targetHandle === "audio-in"
      );
      if (!inWire) {
        runtime.syncSource(null);
        continue;
      }

      const sourceUi = uiNodes.find((n) => n.id === inWire.sourceId);
      if (!sourceUi || sourceUi.data.kind !== "oscillator") {
        runtime.syncSource(null);
        continue;
      }

      runtime.syncSource({
        waveform: (sourceUi.data.params.waveform as OscillatorType) ?? "sine",
        frequency: Number(sourceUi.data.params.frequency ?? 220),
      });
    }
  }

  private applyWire(wire: Wire): void {
    const source = this.nodes.get(wire.sourceId);
    const target = this.nodes.get(wire.targetId);
    if (!source || !target) return;

    const srcHandle = parseHandle(wire.sourceHandle);
    const tgtHandle = parseHandle(wire.targetHandle);
    if (!srcHandle || !tgtHandle) return;

    if (srcHandle.signal === "audio") {
      const out = source.getOutput(wire.sourceHandle);
      const inp = target.getInput(wire.targetHandle);
      if (out && inp) {
        try {
          out.connect(inp);
        } catch {
          /* duplicate wire */
        }
      }
    } else if (srcHandle.signal === "cv") {
      const out = source.getOutput(wire.sourceHandle) ?? source.getTap();
      const param = target.getParam(wire.targetHandle);
      if (out && param) {
        const depthGain = this.ctx.createGain();
        depthGain.gain.value = wire.modDepth;
        try {
          out.connect(depthGain);
          depthGain.connect(param);
          this.cvWireGains.push(depthGain);
        } catch {
          /* duplicate */
        }
      }
    }
  }

  start(): void {
    const t = this.ctx.currentTime;
    for (const runtime of this.nodes.values()) {
      if (
        runtime.kind === "oscillator" ||
        runtime.kind === "detune" ||
        runtime.kind === "wavetable" ||
        runtime.kind === "fm" ||
        runtime.kind === "noise" ||
        runtime.kind === "lfo"
      ) {
        runtime.start(t);
      }
    }
    this.setGeneratorKeyGate(false);
    this.running = true;
  }

  stop(): void {
    const t = this.ctx.currentTime;
    this.setGeneratorKeyGate(false);
    for (const runtime of this.nodes.values()) {
      if (
        runtime.kind === "oscillator" ||
        runtime.kind === "detune" ||
        runtime.kind === "wavetable" ||
        runtime.kind === "fm" ||
        runtime.kind === "noise" ||
        runtime.kind === "lfo"
      ) {
        runtime.stop(t + 0.05);
      }
      if (runtime.kind === "envelope") {
        runtime.stop(t);
      }
    }
    this.running = false;
  }

  /** Open/close keyboard gate on tone generators; trigger envelope ADSR. */
  setGeneratorKeyGate(open: boolean): void {
    const t = this.ctx.currentTime;
    for (const runtime of this.nodes.values()) {
      runtime.setKeyGate?.(open, t);
      runtime.triggerGate?.(open, t);
    }
  }

  /** @deprecated Use setGeneratorKeyGate */
  setOscillatorKeyGate(open: boolean): void {
    this.setGeneratorKeyGate(open);
  }

  dispose(): void {
    this.stop();
    for (const runtime of this.nodes.values()) runtime.dispose();
    this.nodes.clear();
    this.registry.clear();
    this.wires = [];
    this.cvWireGains = [];
  }
}
