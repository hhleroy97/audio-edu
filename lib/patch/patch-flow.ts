import type { Edge, Node } from "@xyflow/react";
import type { Patch } from "@/lib/schemas/patch";
import {
  DEFAULT_CV_EDGE_DATA,
  normalizeModDepth,
} from "@/lib/schemas/patch-edge-data";
import type { PatchNodeData, NodeKind } from "./ports";
import { parseHandle } from "./ports";
import { applyLayoutToFlowNodes } from "./layout";

function migrateEdgeData(data: Record<string, unknown> | undefined) {
  if (!data) return data;
  if (data.signal !== "cv") return data;
  const depth =
    typeof data.modDepth === "number"
      ? normalizeModDepth(data.modDepth)
      : DEFAULT_CV_EDGE_DATA.modDepth;
  return {
    ...data,
    modDepth: depth,
    modOffset:
      typeof data.modOffset === "number"
        ? Math.max(-1, Math.min(1, data.modOffset))
        : DEFAULT_CV_EDGE_DATA.modOffset,
    modBipolar:
      typeof data.modBipolar === "boolean"
        ? data.modBipolar
        : DEFAULT_CV_EDGE_DATA.modBipolar,
  };
}

/** Convert a validated Patch into React Flow nodes/edges for the audio engine. */
export function patchToFlow(patch: Patch): {
  nodes: Node<PatchNodeData>[];
  edges: Edge[];
} {
  const edges = patch.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: "patchCable" as const,
    data:
      e.signal === "cv"
        ? migrateEdgeData({
            signal: e.signal,
            ...DEFAULT_CV_EDGE_DATA,
          })
        : { signal: e.signal },
  }));

  const nodes = patch.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: {
      label: n.type.charAt(0).toUpperCase() + n.type.slice(1),
      kind: n.type as NodeKind,
      params: n.params,
      layout: n.layout,
    },
  }));

  return {
    nodes: applyLayoutToFlowNodes(nodes, edges),
    edges,
  };
}
