import { z } from "zod";
import { RulePackSectionKind } from "./section-kind";

export const SectionModFxSpec = z.object({
  bodyModProfileId: z.string().optional(),
  topModProfileId: z.string().optional(),
  drumSendReverb: z.number().min(0).max(1).optional(),
  drumSendDelay: z.number().min(0).max(1).optional(),
});

export type SectionModFxSpecType = z.infer<typeof SectionModFxSpec>;

/** Per-section mod profiles + drum send FX (#104). */
export const ModFxDef = z.object({
  bySectionKind: z.record(RulePackSectionKind, SectionModFxSpec).optional(),
  defaultDrumSendReverb: z.number().min(0).max(1).default(0.22),
});

export type ModFxDefType = z.infer<typeof ModFxDef>;
