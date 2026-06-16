import { NodeLayoutSize } from "@/lib/schemas/node-layout";
import type { NodeKind } from "./ports";

/**
 * Authoritative layout footprints per node kind (px).
 * Keep in sync with `AudioNodeShell` and flow node content.
 */
const NODE_LAYOUT_RAW = {
  oscillator: { width: 256, height: 468 },
  detune: { width: 256, height: 528 },
  unison: { width: 256, height: 528 },
  envelope: { width: 256, height: 548 },
  filter: { width: 216, height: 296 },
  wavetable: { width: 216, height: 312 },
  output: { width: 216, height: 132 },
  analyser: { width: 216, height: 128 },
  mixer: { width: 216, height: 236 },
  lfo: { width: 216, height: 320 },
  fm: { width: 256, height: 420 },
  distortion: { width: 216, height: 220 },
  layerStack: { width: 256, height: 380 },
  formant: { width: 216, height: 300 },
  noise: { width: 216, height: 280 },
  multiband: { width: 256, height: 340 },
  modFx: { width: 216, height: 300 },
  filterBank: { width: 256, height: 320 },
  macro: { width: 180, height: 180 },
  sampler: { width: 216, height: 200 },
} as const satisfies Record<NodeKind, NodeLayoutSize>;

export const NODE_LAYOUT_METADATA: Record<NodeKind, NodeLayoutSize> =
  Object.fromEntries(
    Object.entries(NODE_LAYOUT_RAW).map(([kind, size]) => [
      kind,
      NodeLayoutSize.parse(size),
    ])
  ) as Record<NodeKind, NodeLayoutSize>;

export type NodeDimensionMap = Map<string, NodeLayoutSize>;

export function getNodeDimensions(
  kind: NodeKind,
  measured?: NodeLayoutSize | null
): NodeLayoutSize {
  const meta = NODE_LAYOUT_METADATA[kind] ?? { width: 216, height: 200 };
  if (!measured) return meta;
  return {
    width: meta.width,
    height: measured.height,
  };
}

/** Clamp measured footprint: width is always metadata; height tracks content. */
export function normalizeMeasuredLayout(
  kind: NodeKind,
  measured: { width: number; height: number }
): NodeLayoutSize {
  const meta = NODE_LAYOUT_METADATA[kind] ?? { width: 216, height: 200 };
  return NodeLayoutSize.parse({
    width: meta.width,
    height: Math.round(measured.height),
  });
}

export function mergeMeasuredDimensions(
  nodes: { id: string; kind: NodeKind }[],
  measured: NodeDimensionMap
): NodeDimensionMap {
  const merged: NodeDimensionMap = new Map();
  for (const node of nodes) {
    merged.set(node.id, getNodeDimensions(node.kind, measured.get(node.id)));
  }
  return merged;
}
