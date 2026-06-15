import { z } from "zod";

export const GraphNode = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["concept", "experiment", "technique", "component", "source"]),
  summary: z.string(),
  experimentIds: z.array(z.string()),
  sources: z.array(z.string()),
});

export const GraphEdge = z.object({
  from: z.string(),
  to: z.string(),
  predicate: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string().optional(),
});

export const KnowledgeGraph = z.object({
  version: z.string(),
  generatedAt: z.string(),
  fingerprint: z.string(),
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
  stats: z.object({
    experiments: z.number(),
    concepts: z.number(),
    sources: z.number(),
    edges: z.number(),
    deterministic: z.number(),
    llm: z.number(),
  }),
});

export type GraphNode = z.infer<typeof GraphNode>;
export type GraphEdge = z.infer<typeof GraphEdge>;
export type KnowledgeGraph = z.infer<typeof KnowledgeGraph>;
