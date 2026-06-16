import { z } from "zod";
import { SidechainDef } from "./drums";

/** Song-level metadata — reproducible procedural riddim artifacts. */
export const SongMeta = z.object({
  id: z.string(),
  title: z.string(),
  bpm: z.number().min(60).max(200).default(140),
  key: z.string().default("F#"),
  rootMidi: z.number().int().min(0).max(127).optional(),
  bars: z.number().int().min(1),
  beatsPerBar: z.number().int().min(1).default(4),
  gate: z.enum(["auto", "human-review"]).default("human-review"),
  version: z.number().int().min(1).default(1),
});

/** Maps a logical layer (sub, body, lead) to a Patch Lab preset id. */
export const PatchAssignment = z.object({
  layer: z.string(),
  presetId: z.string(),
  defaultMidi: z.number().int().min(0).max(127).optional(),
});

/** Layer role for mix strip EQ defaults (phase 1). */
export const MixProfile = z.enum(["sub", "body", "top", "fx"]);

/** Multibus layer — one parallel preset graph (v2). */
export const SongLayerDef = z.object({
  id: z.string(),
  presetId: z.string(),
  busGain: z.number().min(0).max(1).default(0.75),
  pan: z.number().min(-1).max(1).default(0).optional(),
  defaultMidi: z.number().int().min(0).max(127).optional(),
  mixProfile: MixProfile.optional(),
  /** Trims preset output before mix strip — lower in song context vs solo lab. */
  songGain: z.number().min(0).max(1).optional(),
});

export const DrumHit = z.object({
  beat: z.number().min(0),
  sampleId: z.string(),
  velocity: z.number().min(0).max(1).default(0.8).optional(),
  /** Micro-timing offset in seconds (swing / humanize). */
  microShiftSec: z.number().min(-0.05).max(0.05).optional(),
});

export const DrumSendFx = z.object({
  reverbMix: z.number().min(0).max(1).default(0),
  delayMix: z.number().min(0).max(1).default(0),
});

export type DrumSendFxType = z.infer<typeof DrumSendFx>;

export const DrumLaneDef = z.object({
  hits: z.array(DrumHit).default([]),
  sidechain: SidechainDef.optional(),
  sendFx: DrumSendFx.optional(),
});

export const PatternCombinator = z.enum(["stack", "cat", "slow"]);

/** CV / param automation keyed to absolute beat index. */
export const ModAutomation = z.object({
  beat: z.number().min(0),
  layer: z.string().optional(),
  nodeId: z.string().optional(),
  param: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  durationBeats: z.number().positive().optional(),
});

const PatternEventBase = z.object({
  beat: z.number().min(0),
  layer: z.string().optional(),
});

export const NotePatternEvent = PatternEventBase.extend({
  kind: z.literal("note"),
  midi: z.number().int().min(0).max(127).optional(),
  note: z.string().optional(),
  durationBeats: z.number().positive().default(0.25),
  velocity: z.number().min(0).max(1).optional(),
});

export const PresetPatternEvent = PatternEventBase.extend({
  kind: z.literal("preset"),
  presetId: z.string(),
});

export const GatePatternEvent = PatternEventBase.extend({
  kind: z.literal("gate"),
  open: z.boolean(),
  durationBeats: z.number().positive().optional(),
});

export const AutomationPatternEvent = PatternEventBase.extend({
  kind: z.literal("automation"),
  nodeId: z.string().optional(),
  param: z.string(),
  value: z.union([z.number(), z.string(), z.boolean()]),
  durationBeats: z.number().positive().optional(),
});

export const LayerGainPatternEvent = PatternEventBase.extend({
  kind: z.literal("layerGain"),
  gain: z.number().min(0).max(1),
});

export const LayerPresetPatternEvent = PatternEventBase.extend({
  kind: z.literal("layerPreset"),
  presetId: z.string(),
});

/** Pattern IR event — when something happens on the beat grid. */
export const PatternEvent = z.discriminatedUnion("kind", [
  NotePatternEvent,
  PresetPatternEvent,
  GatePatternEvent,
  AutomationPatternEvent,
  LayerGainPatternEvent,
  LayerPresetPatternEvent,
]);

export const SectionDef = z.object({
  id: z.string(),
  label: z.string(),
  startBar: z.number().int().min(0),
  endBar: z.number().int().min(1),
  combinator: PatternCombinator.optional(),
  muteLayers: z.array(z.string()).optional(),
  patches: z.array(PatchAssignment).optional(),
  events: z.array(PatternEvent).default([]),
  automations: z.array(ModAutomation).optional(),
  drumHits: z.array(DrumHit).optional(),
});

/** Full declarative song definition (Strudel-inspired IR, Zod-validated). */
export const SongDef = z.object({
  meta: SongMeta,
  schemaVersion: z.number().int().min(1).default(1),
  layers: z.array(SongLayerDef).default([]),
  patches: z.array(PatchAssignment).default([]),
  drums: DrumLaneDef.optional(),
  sections: z.array(SectionDef).min(1),
});

export type SongMetaType = z.infer<typeof SongMeta>;
export type MixProfileType = z.infer<typeof MixProfile>;
export type PatchAssignmentType = z.infer<typeof PatchAssignment>;
export type SongLayerDefType = z.infer<typeof SongLayerDef>;
export type DrumHitType = z.infer<typeof DrumHit>;
export type DrumLaneDefType = z.infer<typeof DrumLaneDef>;
export type PatternCombinatorType = z.infer<typeof PatternCombinator>;
export type ModAutomationType = z.infer<typeof ModAutomation>;
export type PatternEventType = z.infer<typeof PatternEvent>;
export type SectionDefType = z.infer<typeof SectionDef>;
export type SongDefType = z.infer<typeof SongDef>;
