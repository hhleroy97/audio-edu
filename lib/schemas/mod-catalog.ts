import { z } from "zod";
import { RulePackSectionKind } from "./section-kind";

/** Seed-rotated mod profile pools per section kind (#110). */
export const ModCatalogDef = z.object({
  bodyBySectionKind: z
    .record(RulePackSectionKind, z.array(z.string()).min(1))
    .optional(),
  topBySectionKind: z
    .record(RulePackSectionKind, z.array(z.string()).min(1))
    .optional(),
  rotateWithSeed: z.boolean().default(true),
});

export type ModCatalogDefType = z.infer<typeof ModCatalogDef>;
