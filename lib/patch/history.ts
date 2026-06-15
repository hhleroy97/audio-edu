import type { Edge, Node } from "@xyflow/react";
import type { PatchNodeData } from "./ports";

export type GraphSnapshot = {
  nodes: Node<PatchNodeData>[];
  edges: Edge[];
};

export const MAX_HISTORY = 50;

export function cloneGraph(
  nodes: Node<PatchNodeData>[],
  edges: Edge[]
): GraphSnapshot {
  return {
    nodes: structuredClone(
      nodes.map((n) => ({ ...n, selected: false }))
    ) as Node<PatchNodeData>[],
    edges: structuredClone(
      edges.map((e) => ({ ...e, selected: false }))
    ) as Edge[],
  };
}

export function isUndoableNodeChange(
  changes: { type: string }[]
): boolean {
  return changes.some(
    (c) => c.type === "add" || c.type === "remove" || c.type === "replace"
  );
}

export function isUndoableEdgeChange(
  changes: { type: string }[]
): boolean {
  return changes.some(
    (c) => c.type === "add" || c.type === "remove" || c.type === "replace"
  );
}
