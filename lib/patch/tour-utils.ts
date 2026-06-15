import type { Edge } from "@xyflow/react";
import type { TourStep } from "@/lib/schemas/patch";

/** Whether `from` can reach `to` following directed audio edges. */
export function hasAudioPath(
  edges: Pick<Edge, "source" | "target">[],
  from: string,
  to: string
): boolean {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  }

  const visited = new Set<string>();
  const stack = [from];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (id === to) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adj.get(id) ?? []) stack.push(next);
  }

  return false;
}

export function isDoStepSatisfied(
  step: TourStep,
  edges: Pick<Edge, "source" | "target">[]
): boolean {
  const req = step.requires;
  if (!req) return true;

  if (req.edge) {
    return hasAudioPath(edges, req.edge.from, req.edge.to);
  }

  return true;
}
