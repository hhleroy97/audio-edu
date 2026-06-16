import type { Edge, Node } from "@xyflow/react";
import { AudioEngine } from "@/lib/patch/audio-engine";
import { patchToFlow } from "@/lib/patch/patch-flow";
import type { PatchNodeData } from "@/lib/patch/ports";
import { presetToPatch } from "@/lib/patch/presets/load";
import { midiToFrequency } from "@/lib/patch/piano-keyboard";
import type { MixProfileType } from "@/lib/schemas/song";
import { inferMixProfile } from "./mix-profiles";

const SONG_GAIN_NODE_KINDS = new Set([
  "output",
  "distortion",
  "fm",
  "oscillator",
  "wavetable",
  "noise",
]);

/** Parallel voices per mix profile (#116). */
export const VOICE_POOL_SIZE: Record<MixProfileType, number> = {
  sub: 1,
  body: 4,
  top: 2,
  fx: 2,
};

type LayerVoice = {
  engine: AudioEngine;
  trim: GainNode;
  busyUntil: number;
};

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
  private readonly voices: LayerVoice[] = [];
  private readonly mixProfile: MixProfileType;
  private flowNodes: Node<PatchNodeData>[] = [];
  private flowEdges: Edge[] = [];
  private songGain = 1;

  constructor(
    private readonly ctx: AudioContext | OfflineAudioContext,
    readonly layerId: string,
    mixStripInput: GainNode,
    mixProfile?: MixProfileType
  ) {
    this.mixProfile = mixProfile ?? inferMixProfile(layerId);
    const voiceCount = VOICE_POOL_SIZE[this.mixProfile];
    const perVoiceGain = 1 / Math.max(1, voiceCount);
    const ctxAudio = ctx as unknown as AudioContext;

    for (let i = 0; i < voiceCount; i++) {
      const trim = ctx.createGain();
      trim.gain.value = perVoiceGain;
      const engine = new AudioEngine(ctxAudio);
      engine.setOutputDestination(trim);
      trim.connect(mixStripInput);
      this.voices.push({ engine, trim, busyUntil: 0 });
    }
  }

  /** Primary voice — backward compat for diagnostics. */
  get engine(): AudioEngine {
    return this.voices[0]!.engine;
  }

  get voiceCount(): number {
    return this.voices.length;
  }

  private forEachVoice(fn: (voice: LayerVoice) => void): void {
    for (const voice of this.voices) fn(voice);
  }

  private acquireVoice(atTime: number): LayerVoice {
    const free = this.voices.find((v) => v.busyUntil <= atTime + 0.001);
    if (free) return free;
    return this.voices.reduce((a, b) => (a.busyUntil <= b.busyUntil ? a : b));
  }

  private syncAllVoices(): void {
    this.forEachVoice((voice) => {
      voice.engine.syncUiGraph(this.flowNodes, this.flowEdges);
    });
  }

  setSongGain(gain: number): void {
    this.songGain = Math.max(0, Math.min(1, gain));
    const perVoiceGain = this.songGain / Math.max(1, this.voices.length);
    this.forEachVoice((voice) => {
      voice.trim.gain.value = perVoiceGain;
    });
    if (this.flowNodes.length > 0) {
      this.flowNodes = applySongGainToFlow(this.flowNodes, this.songGain);
      this.syncAllVoices();
    }
  }

  loadPreset(presetId: string, songGain?: number): boolean {
    const patch = presetToPatch(presetId);
    if (!patch) return false;
    if (songGain !== undefined) {
      this.songGain = Math.max(0, Math.min(1, songGain));
    }
    const perVoiceGain = this.songGain / Math.max(1, this.voices.length);
    this.forEachVoice((voice) => {
      voice.trim.gain.value = perVoiceGain;
    });
    const flow = patchToFlow(patch);
    this.flowNodes = applySongGainToFlow(flow.nodes, this.songGain);
    this.flowEdges = flow.edges;
    this.syncAllVoices();
    return true;
  }

  setTransportBpm(bpm: number): void {
    this.forEachVoice((voice) => voice.engine.setTransportBpm(bpm));
  }

  setNoteHz(hz: number, atTime?: number): void {
    const voice = this.acquireVoice(atTime ?? 0);
    if (atTime !== undefined) {
      voice.engine.setActiveNoteHzAt(hz, atTime);
    } else {
      voice.engine.setActiveNoteHz(hz);
    }
  }

  setNoteMidi(midi: number, atTime?: number): void {
    this.setNoteHz(midiToFrequency(midi), atTime);
  }

  setGate(open: boolean, atTime?: number): void {
    this.forEachVoice((voice) => {
      if (atTime !== undefined) {
        voice.engine.setGeneratorKeyGateAt(open, atTime);
      } else {
        voice.engine.setGeneratorKeyGate(open);
      }
    });
  }

  scheduleNote(midi: number, startTime: number, durationSec: number): void {
    const voice = this.acquireVoice(startTime);
    voice.busyUntil = startTime + durationSec;
    voice.engine.setActiveNoteHzAt(midiToFrequency(midi), startTime);
    voice.engine.setGeneratorKeyGateAt(true, startTime);
    voice.engine.setGeneratorKeyGateAt(false, startTime + durationSec);
  }

  /** Stack chord tones on separate voices (#116). */
  scheduleChord(midis: number[], startTime: number, durationSec: number): void {
    const unique = [...new Set(midis)];
    for (const midi of unique) {
      this.scheduleNote(midi, startTime, durationSec);
    }
  }

  setNodeParamsAt(
    nodeId: string,
    params: Record<string, number | string | boolean>,
    atTime: number
  ): void {
    this.forEachVoice((voice) => {
      voice.engine.setNodeParamsAt(nodeId, params, atTime);
    });
  }

  async start(): Promise<void> {
    if ("resume" in this.ctx && typeof this.ctx.resume === "function") {
      await this.ctx.resume();
    }
    this.syncAllVoices();
    for (const voice of this.voices) {
      voice.engine.start();
    }
  }

  stop(): void {
    this.forEachVoice((voice) => voice.engine.stop());
  }

  dispose(): void {
    this.forEachVoice((voice) => {
      voice.engine.dispose();
      voice.trim.disconnect();
    });
  }
}
