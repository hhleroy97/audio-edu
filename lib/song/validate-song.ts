import { z } from "zod";
import { getPatchPreset } from "@/lib/patch/presets/index";
import {
  SongDef,
  type SongDefType,
  type PatternEventType,
} from "@/lib/schemas/song";
import { lintSong } from "./lint-song";

export type SongValidationResult = {
  song: SongDefType;
  repaired: boolean;
  warnings: string[];
};

function repairRawInput(raw: unknown): { value: unknown; repaired: boolean } {
  if (!raw || typeof raw !== "object") {
    return { value: raw, repaired: false };
  }

  let repaired = false;
  const obj = { ...(raw as Record<string, unknown>) };
  const meta =
    obj.meta && typeof obj.meta === "object"
      ? { ...(obj.meta as Record<string, unknown>) }
      : {};

  if (meta.bpm === undefined) {
    meta.bpm = 140;
    repaired = true;
  }
  if (meta.beatsPerBar === undefined) {
    meta.beatsPerBar = 4;
    repaired = true;
  }
  if (meta.gate === undefined) {
    meta.gate = "human-review";
    repaired = true;
  }
  if (meta.version === undefined) {
    meta.version = 1;
    repaired = true;
  }
  obj.meta = meta;

  if (obj.schemaVersion === undefined) {
    obj.schemaVersion = Array.isArray(obj.layers) && obj.layers.length > 0 ? 2 : 1;
    repaired = true;
  }

  if (!Array.isArray(obj.layers)) {
    obj.layers = [];
    repaired = true;
  }

  if (!Array.isArray(obj.patches)) {
    obj.patches = [];
    repaired = true;
  }

  if (Array.isArray(obj.sections)) {
    obj.sections = (obj.sections as Record<string, unknown>[]).map(
      (section) => {
        const next = { ...section };
        if (!Array.isArray(next.events)) {
          next.events = [];
          repaired = true;
        }
        return next;
      }
    );
  }

  return { value: obj, repaired };
}

function inferEventKind(event: Record<string, unknown>): PatternEventType["kind"] | null {
  if (typeof event.kind === "string") {
    return event.kind as PatternEventType["kind"];
  }
  if (typeof event.presetId === "string") {
    return event.layer !== undefined ? "layerPreset" : "preset";
  }
  if (typeof event.gain === "number") return "layerGain";
  if (typeof event.reverbMix === "number") return "drumSendFx";
  if (typeof event.open === "boolean") return "gate";
  if (typeof event.param === "string") return "automation";
  if (event.midi !== undefined || typeof event.note === "string") return "note";
  return null;
}

function repairEvents(events: unknown[]): {
  events: unknown[];
  repaired: boolean;
} {
  let repaired = false;
  const next = events.map((ev) => {
    if (!ev || typeof ev !== "object") return ev;
    const event = { ...(ev as Record<string, unknown>) };
    if (event.kind === undefined) {
      const kind = inferEventKind(event);
      if (kind) {
        event.kind = kind;
        repaired = true;
      }
    }
    if (event.kind === "note" && event.durationBeats === undefined) {
      event.durationBeats = 0.25;
      repaired = true;
    }
    if (event.kind === "layerGain" && typeof event.gain !== "number") {
      event.gain = 0;
      repaired = true;
    }
    if (typeof event.beat === "number" && event.beat < 0) {
      event.beat = 0;
      repaired = true;
    }
    return event;
  });
  return { events: next, repaired };
}

/** Parse + repair song JSON; warns on unknown preset ids but still validates schema. */
export function validateSong(raw: unknown): SongValidationResult {
  const { value: repairedRaw, repaired: metaRepaired } = repairRawInput(raw);
  let repaired = metaRepaired;
  const warnings: string[] = [];

  if (
    repairedRaw &&
    typeof repairedRaw === "object" &&
    Array.isArray((repairedRaw as { sections?: unknown }).sections)
  ) {
    const obj = repairedRaw as { sections: Record<string, unknown>[] };
    obj.sections = obj.sections.map((section) => {
      if (!Array.isArray(section.events)) return section;
      const { events, repaired: evRepaired } = repairEvents(section.events);
      if (evRepaired) repaired = true;
      return { ...section, events };
    });
  }

  const parsed = SongDef.parse(repairedRaw);

  const presetIds = new Set<string>();
  for (const l of parsed.layers) presetIds.add(l.presetId);
  for (const p of parsed.patches) presetIds.add(p.presetId);
  for (const section of parsed.sections) {
    for (const p of section.patches ?? []) presetIds.add(p.presetId);
    for (const ev of section.events) {
      if (ev.kind === "preset" || ev.kind === "layerPreset") {
        presetIds.add(ev.presetId);
      }
    }
  }

  for (const id of presetIds) {
    if (!getPatchPreset(id)) {
      warnings.push(`unknown preset id: ${id}`);
    }
  }

  const lint = lintSong(parsed);
  warnings.push(...lint.warnings);
  if (!lint.ok) {
    throw new z.ZodError(
      lint.errors.map((message) => ({
        code: "custom" as const,
        message,
        path: ["lint"],
      }))
    );
  }

  return { song: parsed, repaired, warnings };
}
