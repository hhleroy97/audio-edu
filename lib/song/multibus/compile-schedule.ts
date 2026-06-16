import type { ModAutomationType, PatternEventType, SongDefType } from "@/lib/schemas/song";
import { beatToSeconds, flattenSongEvents, songDurationSec } from "../timeline";

export type CompiledAction =
  | {
      atTime: number;
      type: "note";
      layerId: string;
      midi: number;
      durationSec: number;
      absoluteBeat: number;
    }
  | {
      atTime: number;
      type: "layerGain";
      layerId: string;
      gain: number;
      absoluteBeat: number;
    }
  | {
      atTime: number;
      type: "layerPreset";
      layerId: string;
      presetId: string;
      absoluteBeat: number;
    }
  | {
      atTime: number;
      type: "gate";
      layerId?: string;
      open: boolean;
      durationSec?: number;
      absoluteBeat: number;
    }
  | {
      atTime: number;
      type: "drumHit";
      sampleId: string;
      velocity: number;
      absoluteBeat: number;
    }
  | {
      atTime: number;
      type: "automation";
      layerId: string;
      nodeId: string;
      param: string;
      value: number | string | boolean;
      durationSec?: number;
      absoluteBeat: number;
    };

function defaultMidiForLayer(song: SongDefType, layerId: string): number {
  const layer = song.layers.find((l) => l.id === layerId);
  if (layer?.defaultMidi !== undefined) return layer.defaultMidi;
  const patch = song.patches.find((p) => p.layer === layerId);
  if (patch?.defaultMidi !== undefined) return patch.defaultMidi;
  return song.meta.rootMidi ?? 42;
}

function automationToAction(
  auto: ModAutomationType & { absoluteBeat: number },
  epochTime: number,
  bpm: number,
  defaultLayer: string
): CompiledAction {
  const atTime = epochTime + beatToSeconds(auto.absoluteBeat, bpm);
  return {
    type: "automation",
    layerId: auto.layer ?? defaultLayer,
    nodeId: auto.nodeId ?? "",
    param: auto.param,
    value: auto.value,
    durationSec:
      auto.durationBeats !== undefined
        ? beatToSeconds(auto.durationBeats, bpm)
        : undefined,
    absoluteBeat: auto.absoluteBeat,
    atTime,
  };
}

/** Compile flat Pattern IR → audio-timeline actions from epoch time. */
export function compileMultibusSchedule(
  song: SongDefType,
  epochTime: number,
  bpm = song.meta.bpm
): CompiledAction[] {
  const actions: CompiledAction[] = [];
  const layerGainBySection = new Map<string, Map<string, number>>();

  for (const section of song.sections) {
    if (section.muteLayers?.length) {
      const m = new Map<string, number>();
      for (const id of section.muteLayers) m.set(id, 0);
      layerGainBySection.set(section.id, m);
    }
  }

  for (const section of song.sections) {
    const sectionStartBeat = section.startBar * song.meta.beatsPerBar;
    const muteMap = layerGainBySection.get(section.id);
    if (muteMap) {
      for (const [layerId, gain] of muteMap) {
        actions.push({
          type: "layerGain",
          layerId,
          gain,
          absoluteBeat: sectionStartBeat,
          atTime: epochTime + beatToSeconds(sectionStartBeat, bpm),
        });
      }
    }
    if (section.drumHits) {
      for (const hit of section.drumHits) {
        const absBeat = sectionStartBeat + hit.beat;
        actions.push({
          type: "drumHit",
          sampleId: hit.sampleId,
          velocity: hit.velocity ?? 0.8,
          absoluteBeat: absBeat,
          atTime: epochTime + beatToSeconds(absBeat, bpm),
        });
      }
    }
  }

  if (song.drums?.hits.length) {
    for (const hit of song.drums.hits) {
      actions.push({
        type: "drumHit",
        sampleId: hit.sampleId,
        velocity: hit.velocity ?? 0.8,
        absoluteBeat: hit.beat,
        atTime: epochTime + beatToSeconds(hit.beat, bpm),
      });
    }
  }

  for (const event of flattenSongEvents(song)) {
    const atTime = epochTime + beatToSeconds(event.absoluteBeat, bpm);
    switch (event.kind) {
      case "note": {
        const layerId = event.layer ?? "body";
        actions.push({
          type: "note",
          layerId,
          midi: event.midi ?? defaultMidiForLayer(song, layerId),
          durationSec: beatToSeconds(event.durationBeats, bpm),
          absoluteBeat: event.absoluteBeat,
          atTime,
        });
        break;
      }
      case "layerGain":
        actions.push({
          type: "layerGain",
          layerId: event.layer ?? "body",
          gain: event.gain,
          absoluteBeat: event.absoluteBeat,
          atTime,
        });
        break;
      case "layerPreset":
        actions.push({
          type: "layerPreset",
          layerId: event.layer ?? "body",
          presetId: event.presetId,
          absoluteBeat: event.absoluteBeat,
          atTime,
        });
        break;
      case "gate":
        actions.push({
          type: "gate",
          layerId: event.layer,
          open: event.open,
          durationSec:
            event.durationBeats !== undefined
              ? beatToSeconds(event.durationBeats, bpm)
              : undefined,
          absoluteBeat: event.absoluteBeat,
          atTime,
        });
        break;
      case "automation":
        if (event.nodeId) {
          actions.push({
            type: "automation",
            layerId: event.layer ?? "body",
            nodeId: event.nodeId,
            param: event.param,
            value: event.value,
            durationSec:
              event.durationBeats !== undefined
                ? beatToSeconds(event.durationBeats, bpm)
                : undefined,
            absoluteBeat: event.absoluteBeat,
            atTime,
          });
        }
        break;
      case "preset":
        actions.push({
          type: "layerPreset",
          layerId: event.layer ?? "body",
          presetId: event.presetId,
          absoluteBeat: event.absoluteBeat,
          atTime,
        });
        break;
      default:
        break;
    }
  }

  for (const section of song.sections) {
    const sectionStartBeat = section.startBar * song.meta.beatsPerBar;
    for (const auto of section.automations ?? []) {
      actions.push(
        automationToAction(
          {
            ...auto,
            absoluteBeat: sectionStartBeat + auto.beat,
          },
          epochTime,
          bpm,
          "body"
        )
      );
    }
  }

  actions.sort((a, b) => a.atTime - b.atTime || a.absoluteBeat - b.absoluteBeat);
  return actions;
}

export function scheduleEndTime(
  song: SongDefType,
  epochTime: number,
  bpm = song.meta.bpm
): number {
  return epochTime + songDurationSec(song);
}
