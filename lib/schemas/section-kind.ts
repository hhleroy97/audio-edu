import { z } from "zod";

/** Shared section kinds — kept separate to avoid rule-pack circular imports. */
export const RulePackSectionKind = z.enum([
  "intro",
  "build",
  "drop",
  "break",
  "outro",
]);

export type RulePackSectionKindType = z.infer<typeof RulePackSectionKind>;
