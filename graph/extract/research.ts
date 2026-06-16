import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { GraphEdge, GraphNode, KnowledgeGraph } from "@/lib/schemas/graph";

type SupplementFile = {
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function loadSupplement(path: string): SupplementFile | null {
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    nodes: unknown[];
    edges: unknown[];
  };
  return {
    nodes: raw.nodes.map((n) => GraphNode.parse(n)),
    edges: raw.edges.map((e) => GraphEdge.parse(e)),
  };
}

function edgeKey(e: GraphEdge): string {
  return `${e.from}|${e.to}|${e.predicate}`;
}

/** Merge graph/research/*.json supplements (research / LLM pass) into deterministic backbone. */
export function mergeResearchSupplements(
  graph: KnowledgeGraph,
  root: string
): KnowledgeGraph {
  const researchDir = join(root, "graph/research");
  if (!existsSync(researchDir)) return graph;

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const edgeKeys = new Set(graph.edges.map(edgeKey));
  let llmEdges = 0;

  for (const file of readdirSync(researchDir).filter((f) => f.endsWith(".json"))) {
    const supplement = loadSupplement(join(researchDir, file));
    if (!supplement) continue;

    for (const node of supplement.nodes) {
      const existing = nodeById.get(node.id);
      if (existing) {
        nodeById.set(node.id, {
          ...existing,
          summary:
            node.summary.length > existing.summary.length
              ? node.summary
              : existing.summary,
          sources: [...new Set([...existing.sources, ...node.sources])],
          experimentIds: [
            ...new Set([...existing.experimentIds, ...node.experimentIds]),
          ],
        });
      } else {
        nodeById.set(node.id, node);
      }
    }

    for (const edge of supplement.edges) {
      const key = edgeKey(edge);
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      graph.edges.push(edge);
      llmEdges++;
    }
  }

  graph.nodes = [...nodeById.values()];
  graph.stats.edges = graph.edges.length;
  graph.stats.llm = llmEdges;
  graph.generatedAt = new Date().toISOString();

  return KnowledgeGraph.parse(graph);
}
