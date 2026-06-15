import type { Connection, Edge, Node } from "@xyflow/react";
import { ConnectionRegistry } from "./connection-registry";
import { parseHandle, isSourceHandle, isTargetHandle } from "./ports";
import {
  createRuntimeNode,
  type RuntimeNode,
} from "./runtime-nodes";
import type { PatchNodeData } from "./ports";

type Wire = {
  sourceId: string;
  sourceHandle: string;
  targetId: string;
  targetHandle: string;
};

export class AudioEngine {
  readonly ctx: AudioContext;
  private nodes = new Map<string, RuntimeNode>();
  private registry = new ConnectionRegistry();
  private wires: Wire[] = [];
  private masterAnalyser: AnalyserNode | null = null;
  private running = false;

  constructor(ctx?: AudioContext) {
    this.ctx =
      ctx ??
      new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
  }

  get isRunning(): boolean {
    return this.running;
  }

  get analyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  async resume(): Promise<void> {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  syncUiGraph(
    uiNodes: Node<PatchNodeData>[],
    uiEdges: Edge[]
  ): void {
    const uiIds = new Set(uiNodes.map((n) => n.id));

    for (const [id, runtime] of this.nodes) {
      if (!uiIds.has(id)) {
        runtime.dispose();
        this.nodes.delete(id);
      }
    }

    for (const uiNode of uiNodes) {
      const existing = this.nodes.get(uiNode.id);
      if (existing) {
        existing.setParams(uiNode.data.params, this.ctx.currentTime);
      } else {
        const runtime = createRuntimeNode(
          this.ctx,
          uiNode.data.kind,
          uiNode.id,
          uiNode.data.params
        );
        if (runtime) this.nodes.set(uiNode.id, runtime);
      }
    }

    this.wires = uiEdges.map((e) => ({
      sourceId: e.source,
      sourceHandle: e.sourceHandle ?? "audio-out",
      targetId: e.target,
      targetHandle: e.targetHandle ?? "audio-in",
    }));

    this.registry.rebuild(
      this.wires.map((w) => ({ source: w.sourceId, target: w.targetId }))
    );

    this.reconnectAll();

    const analyserNode = [...this.nodes.values()].find(
      (n) => n.kind === "analyser"
    );
    this.masterAnalyser =
      analyserNode && "analyser" in analyserNode
        ? (analyserNode as RuntimeNode & { analyser: AnalyserNode }).analyser
        : this.findOutputTap();
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
        try {
          out.connect(param);
        } catch {
          /* duplicate */
        }
      }
    }
  }

  start(): void {
    const t = this.ctx.currentTime;
    for (const runtime of this.nodes.values()) {
      if (runtime.kind === "oscillator") runtime.start(t);
    }
    this.running = true;
  }

  stop(): void {
    const t = this.ctx.currentTime;
    for (const runtime of this.nodes.values()) {
      if (runtime.kind === "oscillator") runtime.stop(t + 0.05);
    }
    this.running = false;
  }

  dispose(): void {
    this.stop();
    for (const runtime of this.nodes.values()) runtime.dispose();
    this.nodes.clear();
    this.registry.clear();
    this.wires = [];
  }
}
