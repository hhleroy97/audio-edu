import { midiToFrequency } from "@/lib/patch/piano-keyboard";
import type { PatternEventType } from "@/lib/schemas/song";
import { beatToSeconds } from "./timeline";

/** Minimal bridge from song scheduler → Patch Lab store / engine. */
export type PatchSongBridge = {
  loadPreset: (presetId: string) => void;
  setTransportBpm: (bpm: number) => void;
  setGeneratorKeyGate: (open: boolean) => void;
  updateGeneratorNodesLive: (
    params: Record<string, number | string | boolean>
  ) => void;
  updateNodeParams?: (
    nodeId: string,
    params: Record<string, number | string | boolean>
  ) => void;
  run: () => Promise<void>;
  stop: () => void;
};

export type TriggerPatchNoteOptions = {
  presetId?: string;
  midi: number;
  durationBeats: number;
  bpm: number;
};

let gateCloseTimer: ReturnType<typeof setTimeout> | null = null;

export function clearPatchNoteTimer(): void {
  if (gateCloseTimer) {
    clearTimeout(gateCloseTimer);
    gateCloseTimer = null;
  }
}

/** Load preset (optional), set pitch, open gate, auto-close after duration. */
export function triggerPatchNote(
  bridge: PatchSongBridge,
  options: TriggerPatchNoteOptions
): void {
  const { presetId, midi, durationBeats, bpm } = options;
  if (presetId) bridge.loadPreset(presetId);
  bridge.updateGeneratorNodesLive({ frequency: midiToFrequency(midi) });
  bridge.setGeneratorKeyGate(true);

  clearPatchNoteTimer();
  const ms = beatToSeconds(durationBeats, bpm) * 1000;
  gateCloseTimer = setTimeout(() => {
    bridge.setGeneratorKeyGate(false);
    gateCloseTimer = null;
  }, ms);
}

export function dispatchPatternEvent(
  bridge: PatchSongBridge,
  event: PatternEventType,
  bpm: number,
  layerPresets: Map<string, string>
): void {
  switch (event.kind) {
    case "preset":
      bridge.loadPreset(event.presetId);
      break;
    case "gate":
      bridge.setGeneratorKeyGate(event.open);
      if (event.open && event.durationBeats !== undefined) {
        clearPatchNoteTimer();
        gateCloseTimer = setTimeout(() => {
          bridge.setGeneratorKeyGate(false);
          gateCloseTimer = null;
        }, beatToSeconds(event.durationBeats, bpm) * 1000);
      }
      break;
    case "note": {
      const midi = event.midi ?? 42;
      const presetId =
        event.layer !== undefined
          ? layerPresets.get(event.layer)
          : undefined;
      triggerPatchNote(bridge, {
        presetId,
        midi,
        durationBeats: event.durationBeats,
        bpm,
      });
      break;
    }
    case "automation":
      if (event.nodeId && bridge.updateNodeParams) {
        bridge.updateNodeParams(event.nodeId, {
          [event.param]: event.value,
        });
      }
      break;
    default:
      break;
  }
}

export function buildLayerPresetMap(
  globalPatches: { layer: string; presetId: string }[],
  sectionPatches?: { layer: string; presetId: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of globalPatches) map.set(p.layer, p.presetId);
  for (const p of sectionPatches ?? []) map.set(p.layer, p.presetId);
  return map;
}
