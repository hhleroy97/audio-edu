import { getPatchPreset } from "@/lib/patch/presets/index";
import { isDrumSampleId } from "@/lib/schemas/drums";
import type { SongDefType } from "@/lib/schemas/song";
import { songTotalBeats } from "./timeline";

export type SongLintResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function canonicalLayerIds(song: SongDefType): Set<string> {
  const ids = new Set<string>();
  for (const l of song.layers) ids.add(l.id);
  for (const p of song.patches) ids.add(p.layer);
  return ids;
}

/** Strict lint — fails on unknown presets, timeline overflow, missing layer refs. */
export function lintSong(song: SongDefType): SongLintResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const maxBeat = songTotalBeats(song);
  const layerIds = canonicalLayerIds(song);

  if (song.layers.length === 0 && song.patches.length === 0) {
    errors.push("song must define layers[] or patches[]");
  }

  const presetIds = new Set<string>();
  for (const l of song.layers) presetIds.add(l.presetId);
  for (const p of song.patches) presetIds.add(p.presetId);
  for (const section of song.sections) {
    for (const p of section.patches ?? []) presetIds.add(p.presetId);
    for (const ev of section.events) {
      if (ev.kind === "preset" || ev.kind === "layerPreset") {
        presetIds.add(ev.presetId);
      }
    }
  }

  for (const id of presetIds) {
    if (!getPatchPreset(id)) {
      errors.push(`unknown preset id: ${id}`);
    }
  }

  for (const section of song.sections) {
    if (section.endBar <= section.startBar) {
      errors.push(`section ${section.id}: endBar must exceed startBar`);
    }
    const sectionEndBeat = section.endBar * song.meta.beatsPerBar;
    for (const ev of section.events) {
      const absBeat =
        section.startBar * song.meta.beatsPerBar + ev.beat;
      if (absBeat >= maxBeat + 0.001) {
        errors.push(
          `event in ${section.id} at beat ${ev.beat} exceeds song length (${maxBeat} beats)`
        );
      }
      if (absBeat >= sectionEndBeat + 0.001) {
        warnings.push(
          `event in ${section.id} at local beat ${ev.beat} is past section endBar`
        );
      }
      if (
        (ev.kind === "note" || ev.kind === "layerGain" || ev.kind === "layerPreset") &&
        ev.layer &&
        layerIds.size > 1 &&
        !layerIds.has(ev.layer)
      ) {
        errors.push(`event references unknown layer: ${ev.layer}`);
      }
      if (ev.kind === "note" && !ev.layer && layerIds.size > 1) {
        errors.push("multi-layer song requires layer on note events");
      }
      if (ev.kind === "automation") {
        if (!ev.nodeId) {
          errors.push(`automation in ${section.id} requires nodeId`);
        }
        if (!ev.layer && layerIds.size > 1) {
          warnings.push(
            `automation in ${section.id} at beat ${ev.beat} has no layer — defaults to body`
          );
        }
      }
    }
    for (const auto of section.automations ?? []) {
      if (!auto.nodeId) {
        errors.push(`section ${section.id} automation requires nodeId`);
      }
    }
    for (const id of section.muteLayers ?? []) {
      if (!layerIds.has(id)) {
        errors.push(`section ${section.id} muteLayers unknown id: ${id}`);
      }
    }
  }

  if (song.meta.bars < 4 && song.schemaVersion >= 2) {
    warnings.push("arrangement songs typically use ≥4 bars");
  }

  for (const hit of song.drums?.hits ?? []) {
    if (!isDrumSampleId(hit.sampleId)) {
      errors.push(`unknown drum sampleId: ${hit.sampleId}`);
    }
    if (hit.beat >= maxBeat + 0.001) {
      errors.push(`drum hit at beat ${hit.beat} exceeds song length`);
    }
  }

  for (const section of song.sections) {
    for (const hit of section.drumHits ?? []) {
      if (!isDrumSampleId(hit.sampleId)) {
        errors.push(`unknown drum sampleId in ${section.id}: ${hit.sampleId}`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
