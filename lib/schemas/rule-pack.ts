import { z } from "zod";
import { AgentGate } from "./agents";
import { EvaluationDef, GrooveDef, HarmonyDef, TransitionDef } from "./harmony";
import { SongLayerDef } from "./song";

export const RulePackSectionKind = z.enum([
  "intro",
  "build",
  "drop",
  "break",
  "outro",
]);

export type RulePackSectionKindType = z.infer<typeof RulePackSectionKind>;

export const RulePackSectionSpec = z.object({
  id: z.string(),
  label: z.string(),
  kind: RulePackSectionKind,
  startBar: z.number().int().min(0),
  endBar: z.number().int().min(1),
  bodyPresetId: z.string().optional(),
  modProfileId: z.string().optional(),
  topModProfileId: z.string().optional(),
  includeTop: z.boolean().optional(),
  muteLayers: z.array(z.string()).optional(),
  combinator: z.enum(["stack", "cat", "slow"]).optional(),
});

export type RulePackSectionSpecType = z.infer<typeof RulePackSectionSpec>;

/** Declarative riddim generation recipe — deterministic with seed. */
export const ArrangementRulePack = z.object({
  id: z.string(),
  title: z.string(),
  bars: z.number().int().positive(),
  bpm: z.number().min(60).max(200).default(140),
  key: z.string().default("F#"),
  /** tonal scale name suffix, e.g. "minor pentatonic" */
  scale: z.string().default("minor pentatonic"),
  beatsPerBar: z.number().int().min(1).default(4),
  layers: z.array(SongLayerDef).optional(),
  sections: z.array(RulePackSectionSpec).min(1),
  drumMuteSectionIds: z.array(z.string()).default(["intro", "break", "outro"]),
  gate: AgentGate.default("human-review"),
  harmony: HarmonyDef.optional(),
  groove: GrooveDef.optional(),
  transition: TransitionDef.optional(),
  evaluation: EvaluationDef.optional(),
});

export type ArrangementRulePackType = z.infer<typeof ArrangementRulePack>;

export const PatternAgentConfig = z.object({
  subOctave: z.number().int().min(0).max(8).default(1),
  bodyOctave: z.number().int().min(0).max(8).default(2),
  /** Scale degrees (1-indexed) cycled per hit when seed varies notes. */
  subDegrees: z.array(z.number().int().min(1).max(7)).default([1]),
  bodyDegrees: z.array(z.number().int().min(1).max(7)).default([1, 4]),
});

export type PatternAgentConfigType = z.infer<typeof PatternAgentConfig>;
