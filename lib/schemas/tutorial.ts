import { z } from "zod";
import { Gating } from "./metadata";

export const TutorialChunk = z.object({
  id: z.string(),
  experimentId: z.string(),
  concept: z.string(),
  title: z.string(),
  body: z.string(),
  estimatedMinutes: z.number(),
  prerequisites: z.array(z.string()),
  gate: Gating,
});

export type TutorialChunk = z.infer<typeof TutorialChunk>;
