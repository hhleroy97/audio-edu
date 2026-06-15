import { z } from "zod";

export const Gating = z.enum(["auto", "human-review"]);

export const ExperimentMetadata = z.object({
  slug: z.string(),
  version: z.string(),

  audioModules: z.array(z.string()),
  uiComponents: z.array(z.string()),
  statePatterns: z.array(z.string()),

  relatedExperiments: z.array(z.string()),
  prerequisites: z.array(z.string()),

  conceptTags: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  estimatedCognitiveLoad: z.enum(["low", "medium", "high"]),

  gating: z.object({
    tutorialGeneration: Gating,
    graphInclusion: Gating,
    publish: Gating,
  }),

  changelog: z.array(
    z.object({
      version: z.string(),
      date: z.string(),
      note: z.string(),
    })
  ),
});

export type ExperimentMetadata = z.infer<typeof ExperimentMetadata>;
