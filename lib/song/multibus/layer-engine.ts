import type { Edge, Node } from "@xyflow/react";
import { AudioEngine } from "@/lib/patch/audio-engine";
import { patchToFlow } from "@/lib/patch/patch-flow";
import type { PatchNodeData } from "@/lib/patch/ports";
import { presetToPatch } from "@/lib/patch/presets/load";
import { midiToFrequency } from "@/lib/patch/piano-keyboard";

const SONG_GAIN_NODE_KINDS = new Set([
  "output",
  "distortion",
  "fm",
  "oscillator",
  "wavetable",
  "noise",
]);

/** Scale hot preset params for multibus song context. */
export function applySongGainToFlow(
  nodes: Node<PatchNodeData>[],
  songGain: number
): Node<PatchNodeData>[] {
  const g = Math.max(0, Math.min(1, songGain));
  return nodes.map((node) => {
    if (!SONG_GAIN_NODE_KINDS.has(node.data.kind)) return node;
    const params = { ...node.data.params };
    if (typeof params.gain === "number") {
      params.gain = params.gain * g;
    }
    if (node.data.kind === "distortion" && typeof params.drive === "number") {
      params.drive = params.drive * (0.65 + g * 0.35);
    }
    if (node.data.kind === "fm" && typeof params.index === "number") {
      params.index = params.index * (0.7 + g * 0.3);
    }
    return { ...node, data: { ...node.data, params } };
  });
}

/** One frozen preset graph routed through trim → master-bus mix strip. */
export class LayerEngine {
  readonly engine: AudioEngine;
  private readonly trim: GainNode;
  private flowNodes: Node<PatchNodeData>[] = [];
  private flowEdges: Edge[] = [];
  private songGain = 1;

  constructor(
    ctx: AudioContext | OfflineAudioContext,
    readonly layerId: string,
    mixStripInput: GainNode
  ) {
    this.engine = new AudioEngine(ctx as unknown as AudioContext);
    this.trim = ctx.createGain();
    this.trim.gain.value = 1;
    this.engine.setOutputDestination(this.trim);
    this.trim.connect(mixStripInput);
  }

  setSongGain(gain: number): void {
    this.songGain = Math.max(0, Math.min(1, gain));
    this.trim.gain.value = this.songGain;
    if (this.flowNodes.length > 0) {
      const scaled = applySongGainToFlow(this.flowNodes, this.songGain);
      this.flowNodes = scaled;
      this.engine.syncUiGraph(this.flowNodes, this.flowEdges);
    }
  }

  loadPreset(presetId: string, songGain?: number): boolean {
    const patch = presetToPatch(presetId);
    if (!patch) return false;
    if (songGain !== undefined) {
      this.songGain = Math.max(0, Math.min(1, songGain));
    }
    this.trim.gain.value = this.songGain;
    const flow = patchToFlow(patch);
    this.flowNodes = applySongGainToFlow(flow.nodes, this.songGain);
    this.flowEdges = flow.edges;
    this.engine.syncUiGraph(this.flowNodes, this.flowEdges);
    return true;
  }

  setTransportBpm(bpm: number): void {
    this.engine.setTransportBpm(bpm);
  }

  setNoteHz(hz: number, atTime?: number): void {
    if (atTime !== undefined) {
      this.engine.setActiveNoteHzAt(hz, atTime);
    } else {
      this.engine.setActiveNoteHz(hz);
    }
  }

  setNoteMidi(midi: number, atTime?: number): void {
    this.setNoteHz(midiToFrequency(midi), atTime);
  }

  setGate(open: boolean, atTime?: number): void {
    if (atTime !== undefined) {
      this.engine.setGeneratorKeyGateAt(open, atTime);
    } else {
      this.engine.setGeneratorKeyGate(open);
    }
  }

  scheduleNote(midi: number, startTime: number, durationSec: number): void {
    this.setNoteMidi(midi, startTime);
    this.setGate(true, startTime);
    this.setGate(false, startTime + durationSec);
  }

  setNodeParamsAt(
    nodeId: string,
    params: Record<string, number | string | boolean>,
    atTime: number
  ): void {
    this.engine.setNodeParamsAt(nodeId, params, atTime);
  }

  async start(): Promise<void> {
    if ("resume" in this.engine.ctx && typeof this.engine.ctx.resume === "function") {
      await this.engine.resume();
    }
    this.engine.syncUiGraph(this.flowNodes, this.flowEdges);
    this.engine.start();
  }

  stop(): void {
    this.engine.stop();
  }

  dispose(): void {
    this.engine.dispose();
    this.trim.disconnect();
  }
}
