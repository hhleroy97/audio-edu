import type { Edge, Node } from "@xyflow/react";
import type { PatchNodeData } from "./ports";
import { getModuleTheme } from "./module-theme";

export type ModRoute = {
  edgeId: string;
  sourceId: string;
  sourceLabel: string;
  sourceCode: string;
  targetId: string;
  targetLabel: string;
  targetCode: string;
  sourceHandle: string;
  targetHandle: string;
  depth: number;
};

export function listCvModRoutes(
  nodes: Node<PatchNodeData>[],
  edges: Edge[]
): ModRoute[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const routes: ModRoute[] = [];

  for (const edge of edges) {
    const signal = edge.data?.signal;
    if (signal !== "cv") continue;
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) continue;

    routes.push({
      edgeId: edge.id,
      sourceId: edge.source,
      sourceLabel: source.data.label,
      sourceCode: getModuleTheme(source.data.kind).code,
      targetId: edge.target,
      targetLabel: target.data.label,
      targetCode: getModuleTheme(target.data.kind).code,
      sourceHandle: edge.sourceHandle ?? "cv-out",
      targetHandle: edge.targetHandle ?? "cv-freq",
      depth: typeof edge.data?.modDepth === "number" ? edge.data.modDepth : 1,
    });
  }

  return routes;
}
