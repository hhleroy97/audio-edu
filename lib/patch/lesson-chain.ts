import type { Patch, PatchEdge, PatchNode } from "@/lib/schemas/patch";
import type { NodeKind } from "./ports";
import { layoutPatchGraph, type LayoutEdge, type LayoutNode } from "./layout";
import { NODE_LAYOUT_METADATA } from "./node-layout";

/** Positions are computed — this placeholder satisfies the Patch schema. */
export const LAYOUT_PLACEHOLDER = { x: 0, y: 0 };

type ChainNode = Omit<PatchNode, "position"> & { position?: { x: number; y: number } };

export type LessonChainDef = {
  nodes: ChainNode[];
  edges: PatchEdge[];
};

function toLayoutNodes(nodes: ChainNode[]): LayoutNode[] {
  return nodes.map((n) => ({
    id: n.id,
    kind: n.type as NodeKind,
  }));
}

function toLayoutEdges(edges: PatchEdge[]): LayoutEdge[] {
  return edges.map((e) => ({
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));
}

/** Apply signal-flow layout to a lesson starting patch. */
export function layoutLessonPatch(patch: LessonChainDef): Patch {
  const positions = layoutPatchGraph(
    toLayoutNodes(patch.nodes),
    toLayoutEdges(patch.edges)
  );

  return {
    nodes: patch.nodes.map((n) => ({
      ...n,
      position: positions.get(n.id) ?? n.position ?? LAYOUT_PLACEHOLDER,
      layout: NODE_LAYOUT_METADATA[n.type as NodeKind],
    })),
    edges: patch.edges,
  };
}

/** Ordered node ids along the primary audio path (sources → effects → output). */
export function signalChainOrder(patch: LessonChainDef): string[] {
  const nodes = toLayoutNodes(patch.nodes);
  const edges = toLayoutEdges(patch.edges);
  const positions = layoutPatchGraph(nodes, edges);

  const output = patch.nodes.find((n) => n.type === "output");
  if (!output) {
    return [...patch.nodes]
      .sort((a, b) => (positions.get(a.id)?.x ?? 0) - (positions.get(b.id)?.x ?? 0))
      .map((n) => n.id);
  }

  const preds = new Map<string, string[]>();
  for (const edge of edges) {
    const list = preds.get(edge.target) ?? [];
    list.push(edge.source);
    preds.set(edge.target, list);
  }

  const chain: string[] = [output.id];
  let cursor = output.id;
  const visited = new Set<string>([cursor]);

  while (true) {
    const incoming = preds.get(cursor) ?? [];
    if (incoming.length === 0) break;
    const next = incoming.sort(
      (a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0)
    )[0]!;
    if (visited.has(next)) break;
    chain.unshift(next);
    visited.add(next);
    cursor = next;
  }

  return chain;
}
