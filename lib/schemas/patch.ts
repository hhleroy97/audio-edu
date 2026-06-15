import { z } from "zod";

export const PortType = z.enum(["audio", "cv", "trigger"]);

export const PatchNode = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  params: z.record(z.union([z.number(), z.string(), z.boolean()])),
});

export const PatchEdge = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string(),
  target: z.string(),
  targetHandle: z.string(),
  signal: PortType,
});

export const Patch = z.object({
  nodes: z.array(PatchNode),
  edges: z.array(PatchEdge),
});

export const TourStep = z.object({
  id: z.string(),
  kind: z.enum(["explain", "demo", "do", "reflect"]),
  target: z.string().optional(),
  content: z.string(),
  demoPatch: Patch.optional(),
  requires: z
    .object({
      edge: z.object({ from: z.string(), to: z.string() }).optional(),
      nodeAdded: z.string().optional(),
    })
    .optional(),
});

export const Lesson = z.object({
  slug: z.string(),
  title: z.string(),
  unlocksNodes: z.array(z.string()),
  startingPatch: Patch.optional(),
  pages: z.array(
    z.object({
      title: z.string(),
      steps: z.array(TourStep),
    })
  ),
});

export type PortType = z.infer<typeof PortType>;
export type PatchNode = z.infer<typeof PatchNode>;
export type PatchEdge = z.infer<typeof PatchEdge>;
export type Patch = z.infer<typeof Patch>;
export type TourStep = z.infer<typeof TourStep>;
export type Lesson = z.infer<typeof Lesson>;
