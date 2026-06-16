import type { Edge, Node } from "@xyflow/react";
import type { PatchNodeData } from "./ports";

const SUB_CV_HANDLES = new Set(["cv-freq", "cv-detune", "cv-index", "cv-pos"]);

const SUB_SOURCE_KINDS = new Set(["oscillator", "wavetable", "fm"]);

/** Node IDs feeding a layerStack sub input — CV modulation is blocked. */
export function getSubProtectedSourceIds(
  nodes: Node<PatchNodeData>[],
  edges: Edge[]
): Set<string> {
  const layerStackIds = new Set(
    nodes.filter((n) => n.data.kind === "layerStack").map((n) => n.id)
  );
  const protectedIds = new Set<string>();
  for (const edge of edges) {
    if (
      edge.targetHandle === "audio-in-sub" &&
      layerStackIds.has(edge.target)
    ) {
      const source = nodes.find((n) => n.id === edge.source);
      if (source && SUB_SOURCE_KINDS.has(source.data.kind)) {
        protectedIds.add(edge.source);
      }
    }
  }
  return protectedIds;
}

export function isSubCvConnectionBlocked(
  targetId: string,
  targetHandle: string | null | undefined,
  protectedSourceIds: Set<string>
): boolean {
  if (!targetHandle || !SUB_CV_HANDLES.has(targetHandle)) return false;
  return protectedSourceIds.has(targetId);
}
