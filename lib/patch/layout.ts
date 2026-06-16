import type { NodeKind } from "./ports";
import {
  COLUMN_GAP,
  LAYOUT_PADDING,
  TAP_ROW_OFFSET,
  snapGrid,
} from "./layout-constants";
import {
  findNonOverlappingPosition,
  resolveNodeCollisions,
  type LayoutNode,
  type PositionedLayoutNode,
} from "./collision-layout";
import {
  getNodeDimensions,
  mergeMeasuredDimensions,
  NODE_LAYOUT_METADATA,
  type NodeDimensionMap,
} from "./node-layout";

export type { LayoutNode } from "./collision-layout";
export type LayoutEdge = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export {
  COLUMN_GAP,
  LAYOUT_PADDING,
  NODE_HEIGHT,
  NODE_WIDTH,
  ROW_GAP,
  TAP_ROW_OFFSET,
  NODE_LAYOUT_METADATA,
} from "./layout-constants";
export { getNodeDimensions, type NodeDimensionMap } from "./node-layout";

const snap = snapGrid;

const SOURCE_KINDS = new Set<NodeKind>(["oscillator", "wavetable", "lfo"]);

function isAudioEdge(edge: LayoutEdge): boolean {
  const handle = edge.sourceHandle ?? "audio-out";
  return handle.startsWith("audio");
}

function audioPredecessors(
  nodeId: string,
  edges: LayoutEdge[]
): string[] {
  return edges
    .filter(
      (e) =>
        isAudioEdge(e) &&
        e.target === nodeId &&
        (e.targetHandle ?? "audio-in").startsWith("audio")
    )
    .map((e) => e.source);
}

function audioSuccessors(nodeId: string, edges: LayoutEdge[]): string[] {
  return edges
    .filter(
      (e) =>
        isAudioEdge(e) &&
        e.source === nodeId &&
        (e.targetHandle ?? "audio-in").startsWith("audio")
    )
    .map((e) => e.target);
}

/** Longest-path column assignment along the audio signal flow. */
function computeColumns(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): Map<string, number> {
  const columns = new Map<string, number>();
  const ids = nodes.map((n) => n.id);

  for (const id of ids) {
    const preds = audioPredecessors(id, edges);
    if (preds.length === 0) {
      columns.set(id, 0);
      continue;
    }
    const predCols = preds
      .map((p) => columns.get(p))
      .filter((c): c is number => c !== undefined);
    columns.set(id, predCols.length ? Math.max(...predCols) + 1 : 0);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      const preds = audioPredecessors(id, edges);
      const next =
        preds.length === 0
          ? 0
          : Math.max(...preds.map((p) => columns.get(p) ?? 0)) + 1;
      if ((columns.get(id) ?? 0) !== next) {
        columns.set(id, next);
        changed = true;
      }
    }
  }

  return columns;
}

/** Spread nodes that share a pipeline stage into adjacent horizontal columns. */
function expandColumnsForHorizontalStacks(
  nodes: LayoutNode[],
  columns: Map<string, number>
): Map<string, number> {
  const byColumn = new Map<number, LayoutNode[]>();
  for (const node of nodes) {
    const col = columns.get(node.id) ?? 0;
    const list = byColumn.get(col) ?? [];
    list.push(node);
    byColumn.set(col, list);
  }

  const expanded = new Map<string, number>();
  let shift = 0;

  for (const col of [...byColumn.keys()].sort((a, b) => a - b)) {
    const colNodes = byColumn
      .get(col)!
      .sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || a.id.localeCompare(b.id));

    colNodes.forEach((node, index) => {
      expanded.set(node.id, col + shift + index);
    });
    shift += Math.max(0, colNodes.length - 1);
  }

  return expanded;
}

function pinOutputColumn(
  nodes: LayoutNode[],
  columns: Map<string, number>
): void {
  for (const node of nodes) {
    if (node.kind !== "output") continue;
    const maxProcessorCol = Math.max(
      0,
      ...nodes
        .filter((n) => n.kind !== "output")
        .map((n) => columns.get(n.id) ?? 0)
    );
    columns.set(node.id, maxProcessorCol + 1);
  }
}

function kindRank(kind: NodeKind): number {
  if (SOURCE_KINDS.has(kind)) return 0;
  if (kind === "analyser") return 1;
  if (kind === "output") return 3;
  return 2;
}

function isBranchAnalyser(nodeId: string, edges: LayoutEdge[]): boolean {
  const preds = audioPredecessors(nodeId, edges);
  const succs = audioSuccessors(nodeId, edges);
  if (preds.length !== 1 || succs.length !== 1) return true;

  const source = preds[0]!;
  const outs = audioSuccessors(source, edges);
  return outs.length > 1;
}

function isTapAnalyser(node: LayoutNode, edges: LayoutEdge[]): boolean {
  return node.kind === "analyser" && isBranchAnalyser(node.id, edges);
}

function placeByColumnWidths(
  nodes: LayoutNode[],
  columns: Map<string, number>,
  edges: LayoutEdge[],
  dimensions: NodeDimensionMap
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const hasTapRow = nodes.some((n) => isTapAnalyser(n, edges));
  const mainRowY = LAYOUT_PADDING.y + (hasTapRow ? TAP_ROW_OFFSET : 0);
  const tapRowY = LAYOUT_PADDING.y;

  const colOrder = [...new Set(nodes.map((n) => columns.get(n.id) ?? 0))].sort(
    (a, b) => a - b
  );

  let xCursor = snap(LAYOUT_PADDING.x);

  for (const col of colOrder) {
    const colNodes = nodes
      .filter((n) => (columns.get(n.id) ?? 0) === col)
      .sort(
        (a, b) =>
          kindRank(a.kind) - kindRank(b.kind) || a.id.localeCompare(b.id)
      );

    for (const node of colNodes) {
      const dim = getNodeDimensions(node.kind, dimensions.get(node.id));
      const y = snap(isTapAnalyser(node, edges) ? tapRowY : mainRowY);
      positions.set(node.id, { x: snap(xCursor), y });
      xCursor += dim.width + COLUMN_GAP;
    }
  }

  return positions;
}

/**
 * Assign canvas positions left-to-right by signal flow.
 * Horizontal spacing uses per-node width metadata (or measured overrides).
 */
export function layoutPatchGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  measuredDimensions: NodeDimensionMap = new Map()
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return positions;

  const dimensions = mergeMeasuredDimensions(nodes, measuredDimensions);
  const baseColumns = computeColumns(nodes, edges);
  const columns = expandColumnsForHorizontalStacks(nodes, baseColumns);
  pinOutputColumn(nodes, columns);

  for (const [id, pos] of placeByColumnWidths(nodes, columns, edges, dimensions)) {
    positions.set(id, pos);
  }

  const connected = new Set<string>();
  for (const edge of edges) {
    connected.add(edge.source);
    connected.add(edge.target);
  }

  const disconnected = nodes
    .filter((n) => !connected.has(n.id))
    .sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || a.id.localeCompare(b.id));

  if (disconnected.length > 0) {
    let maxRight = LAYOUT_PADDING.x;
    for (const node of nodes) {
      if (!connected.has(node.id)) continue;
      const pos = positions.get(node.id);
      if (!pos) continue;
      const dim = getNodeDimensions(node.kind, dimensions.get(node.id));
      maxRight = Math.max(maxRight, pos.x + dim.width);
    }

    let x = snap(maxRight + COLUMN_GAP);
    const mainRowY =
      LAYOUT_PADDING.y +
      (nodes.some((n) => isTapAnalyser(n, edges)) ? TAP_ROW_OFFSET : 0);

    for (const node of disconnected) {
      positions.set(node.id, { x: snap(x), y: snap(mainRowY) });
      const dim = getNodeDimensions(node.kind, dimensions.get(node.id));
      x += dim.width + COLUMN_GAP;
    }
  }

  return finalizePositions(nodes, positions, dimensions);
}

function finalizePositions(
  nodes: LayoutNode[],
  positions: Map<string, { x: number; y: number }>,
  dimensions: NodeDimensionMap
): Map<string, { x: number; y: number }> {
  const positioned: PositionedLayoutNode[] = nodes
    .map((node) => {
      const pos = positions.get(node.id);
      if (!pos) return null;
      return { ...node, x: pos.x, y: pos.y };
    })
    .filter((n): n is PositionedLayoutNode => n !== null);

  return resolveNodeCollisions(positioned, { dimensions });
}

export function suggestNodeSeed(
  kind: NodeKind,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  newId: string,
  existingPositions: Map<string, { x: number; y: number }>,
  measuredDimensions: NodeDimensionMap = new Map()
): { x: number; y: number } {
  const connected = edges.some((e) => e.source === newId || e.target === newId);
  let seed = { x: LAYOUT_PADDING.x, y: LAYOUT_PADDING.y };

  if (!connected) {
    let maxRight = LAYOUT_PADDING.x;
    for (const node of nodes) {
      const x = existingPositions.get(node.id)?.x ?? LAYOUT_PADDING.x;
      const dim = getNodeDimensions(node.kind, measuredDimensions.get(node.id));
      maxRight = Math.max(maxRight, x + dim.width);
    }
    const newDim = getNodeDimensions(kind);
    seed = { x: snap(maxRight + COLUMN_GAP), y: snap(LAYOUT_PADDING.y) };
    void newDim;
  } else {
    seed =
      layoutPatchGraph([...nodes, { id: newId, kind }], edges, measuredDimensions).get(
        newId
      ) ?? seed;
  }

  return { x: snap(seed.x), y: snap(seed.y) };
}

export function suggestNodePosition(
  kind: NodeKind,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  newId: string,
  existingPositions: Map<string, { x: number; y: number }>,
  measuredDimensions: NodeDimensionMap = new Map()
): { x: number; y: number } {
  const dimensions = mergeMeasuredDimensions(nodes, measuredDimensions);
  const existing: PositionedLayoutNode[] = nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    x: existingPositions.get(n.id)?.x ?? LAYOUT_PADDING.x,
    y: existingPositions.get(n.id)?.y ?? LAYOUT_PADDING.y,
  }));

  const seed = suggestNodeSeed(
    kind,
    nodes,
    edges,
    newId,
    existingPositions,
    measuredDimensions
  );
  return findNonOverlappingPosition(kind, seed, existing, { dimensions });
}

export function applyLayoutToFlowNodes<
  T extends { id: string; position: { x: number; y: number }; data: { kind: NodeKind } },
>(nodes: T[], edges: LayoutEdge[], measuredDimensions: NodeDimensionMap = new Map()): T[] {
  const positions = layoutPatchGraph(
    nodes.map((n) => ({ id: n.id, kind: n.data.kind })),
    edges,
    measuredDimensions
  );
  return nodes.map((n) => {
    const pos = positions.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
}
