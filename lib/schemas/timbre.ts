import { z } from "zod";
import { RulePackSectionKind } from "./rule-pack";

const LayerPreset = z.object({
  sub: z.string().default("clean-sub"),
  body: z.string().nullable().optional(),
  top: z.string().nullable().optional(),
});

/** Section-kind → preset archetype mapping (#103 catalog). */
export const TimbreDef = z.object({
  bySectionKind: z
    .record(RulePackSectionKind, LayerPreset)
    .optional(),
  dropBBodySwap: z.string().optional(),
  defaultTopPresetId: z.string().default("pro-metallic-comb"),
});

export type TimbreDefType = z.infer<typeof TimbreDef>;

export const SectionTimbrePlan = z.object({
  sectionId: z.string(),
  layers: z.array(
    z.object({
      id: z.string(),
      presetId: z.string(),
      mixProfile: z.enum(["sub", "body", "top", "fx"]).optional(),
      busGain: z.number().min(0).max(1).optional(),
      songGain: z.number().min(0).max(1).optional(),
      defaultMidi: z.number().int().min(0).max(127).optional(),
    })
  ),
  bodyPresetOverride: z.string().optional(),
});

export type SectionTimbrePlanType = z.infer<typeof SectionTimbrePlan>;
