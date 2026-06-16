import { z } from "zod";

const SectionKind = z.enum(["intro", "build", "drop", "break", "outro"]);

/** Roman-numeral harmony recipe for HarmonyAgent (#112). */
export const HarmonyDef = z.object({
  /** e.g. ['i', 'i', 'iv', 'i'] in key */
  progression: z.array(z.string()).default(["i", "i", "iv", "i"]),
  subOctave: z.number().int().min(0).max(8).default(1),
  bodyOctave: z.number().int().min(0).max(8).default(2),
  /** Extra scale-degree offset per section kind (cycles progression index). */
  kindOffsets: z.record(SectionKind, z.number().int()).optional(),
});

export type HarmonyDefType = z.infer<typeof HarmonyDef>;

export const SectionHarmonyPlan = z.object({
  sectionId: z.string(),
  subDegrees: z.array(z.number().int().min(1).max(7)),
  bodyDegrees: z.array(z.number().int().min(1).max(7)),
  rootMidi: z.number().int().min(0).max(127),
});

export type SectionHarmonyPlanType = z.infer<typeof SectionHarmonyPlan>;

/** Groove variation — euclidean fills, ghost snares (#91). */
export const GrooveDef = z.object({
  ghostSnare: z
    .object({
      enabled: z.boolean().default(true),
      velocity: z.number().min(0).max(1).default(0.28),
      /** Offbeat step within bar (0–3). */
      beatInBar: z.number().int().min(0).max(15).default(3),
    })
    .optional(),
  hatEuclidean: z
    .object({
      pulses: z.number().int().positive().default(5),
      steps: z.number().int().positive().default(16),
    })
    .optional(),
  /** Apply cat-style phrase split on sections with combinator cat. */
  enableCatPhrases: z.boolean().default(true),
});

export type GrooveDefType = z.infer<typeof GrooveDef>;

/** Pre-drop / build transition automation (#94, #99). */
export const TransitionDef = z.object({
  /** Bars before section end to dip body gain (build → drop). */
  preDropBodyDipBeats: z.number().positive().default(2),
  preDropBodyGain: z.number().min(0).max(1).default(0.12),
  /** Filter close automation on build tail (nodeId, param from mod profiles). */
  buildFilterSweep: z
    .object({
      nodeId: z.string().default("filt-1"),
      param: z.string().default("frequency"),
      startHz: z.number().positive().default(800),
      endHz: z.number().positive().default(220),
    })
    .optional(),
});

export type TransitionDefType = z.infer<typeof TransitionDef>;

/** Quality gates for EvaluationAgent (#105). */
export const EvaluationDef = z.object({
  minDropNotes: z.number().int().positive().default(4),
  minDrumHits: z.number().int().positive().default(8),
  minDropSections: z.number().int().positive().default(1),
});

export type EvaluationDefType = z.infer<typeof EvaluationDef>;

export const EvaluationReport = z.object({
  ok: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  metrics: z.object({
    dropNoteCount: z.number(),
    drumHitCount: z.number(),
    dropSectionCount: z.number(),
    totalNoteCount: z.number(),
  }),
});

export type EvaluationReportType = z.infer<typeof EvaluationReport>;
