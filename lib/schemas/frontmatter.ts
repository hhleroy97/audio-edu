import { z } from "zod";

export const ExperimentFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  slug: z.string(),
  order: z.number(),
  learningObjectives: z.array(z.string()),
  prerequisites: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  estimatedMinutes: z.number(),
  concepts: z.array(z.string()),
  author: z.string().optional(),
  version: z.string().optional(),
  changelog: z.array(z.string()).optional(),
  compatibility: z
    .object({
      requiresAudioPlayback: z.boolean().optional(),
      mobileFriendly: z.boolean().optional(),
    })
    .optional(),
  summary: z.string().optional(),
});

export type ExperimentFrontmatter = z.infer<typeof ExperimentFrontmatter>;
