import { z } from "zod";

/** Melodic motion + humanization recipe for MelodicPhraseAgent (#107). */
export const MelodyDef = z.object({
  enableChops: z.boolean().default(true),
  chopEveryBars: z.number().int().positive().default(2),
  octaveJumpProbability: z.number().min(0).max(1).default(0.15),
  /** Off-grid jitter in ms — DSF "turn off quantize" on basslines. */
  microTimingMs: z.number().min(0).max(50).default(12),
  /** Alternate melodic hits between sub and body (hocket). */
  hocketAlternate: z.boolean().default(true),
});

export type MelodyDefType = z.infer<typeof MelodyDef>;
