import { z } from "zod";
import { RulePackSectionKind } from "./section-kind";

/** Riddim halftime pocket — bounce kicks, 2-bar phrases, swing (#125–127). */
export const RiddimPocketDef = z.object({
  bounceKick: z
    .object({
      enabled: z.boolean().default(true),
      velocity: z.number().min(0).max(1).default(0.35),
    })
    .optional(),
  mainSnareBeat: z.number().int().min(0).max(15).default(1),
  ghostSnares: z
    .object({
      beats: z.array(z.number().int().min(0).max(15)).default([3]),
      velocity: z.number().min(0).max(1).default(0.28),
    })
    .optional(),
  phraseBars: z.number().int().positive().default(2),
  barBVariant: z
    .enum(["extra-bounce", "hat-roll", "none"])
    .default("extra-bounce"),
  swingMs: z.number().min(0).max(30).default(8),
  velocityJitter: z.number().min(0).max(0.3).default(0.06),
});

export type RiddimPocketDefType = z.infer<typeof RiddimPocketDef>;

/** 4-bar REMI-z phrase templates — A/B/C/D slots per section kind (#111). */
export const RhythmPhraseDef = z.object({
  phraseLengthBars: z.literal(4).default(4),
  templates: z
    .record(RulePackSectionKind, z.array(z.string()).min(1))
    .optional(),
});

export type RhythmPhraseDefType = z.infer<typeof RhythmPhraseDef>;
