import {
  COLUMN_GAP,
  DEFAULT_COLUMN_STRIDE,
  LAYOUT_PADDING,
  snapGrid,
} from "./layout-constants";
import {
  getNodeDimensions,
  type NodeDimensionMap,
} from "./node-layout";
import type { NodeKind } from "./ports";

export const COLLISION_PADDING = 16;

export type LayoutNode = {
  id: string;
  kind: NodeKind;
};

export type PositionedLayoutNode = LayoutNode & {
  x: number;
  y: number;
};

type Bounds = {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type CollisionResolveOptions = {
  padding?: number;
  maxIterations?: number;
  movable?: ReadonlySet<string>;
  dimensions?: NodeDimensionMap;
};

const snap = snapGrid;

function getBounds(
  node: PositionedLayoutNode,
  padding: number,
  dimensions?: NodeDimensionMap
): Bounds {
  const dim = getNodeDimensions(node.kind, dimensions?.get(node.id));
  return {
    id: node.id,
    left: node.x - padding / 2,
    top: node.y - padding / 2,
    right: node.x + dim.width + padding / 2,
    bottom: node.y + dim.height + padding / 2,
  };
}

type Separation = {
  pushA: { dx: number; dy: number };
  pushB: { dx: number; dy: number };
};

export function getPairSeparation(
  a: PositionedLayoutNode,
  b: PositionedLayoutNode,
  padding = COLLISION_PADDING,
  dimensions?: NodeDimensionMap
): Separation | null {
  return separationForPair(getBounds(a, padding, dimensions), getBounds(b, padding, dimensions));
}

function separationForPair(a: Bounds, b: Bounds): Separation | null {
  const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (overlapX <= 0 || overlapY <= 0) return null;

  if (overlapX < overlapY) {
    if (a.left + (a.right - a.left) / 2 <= b.left + (b.right - b.left) / 2) {
      return {
        pushA: { dx: -overlapX, dy: 0 },
        pushB: { dx: overlapX, dy: 0 },
      };
    }
    return {
      pushA: { dx: overlapX, dy: 0 },
      pushB: { dx: -overlapX, dy: 0 },
    };
  }

  if (a.top + (a.bottom - a.top) / 2 <= b.top + (b.bottom - b.top) / 2) {
    return {
      pushA: { dx: 0, dy: -overlapY },
      pushB: { dx: 0, dy: overlapY },
    };
  }
  return {
    pushA: { dx: 0, dy: overlapY },
    pushB: { dx: 0, dy: -overlapY },
  };
}

export function resolveNodeCollisions(
  nodes: PositionedLayoutNode[],
  options: CollisionResolveOptions = {}
): Map<string, { x: number; y: number }> {
  const padding = options.padding ?? COLLISION_PADDING;
  const maxIterations = options.maxIterations ?? 64;
  const movable = options.movable ?? new Set(nodes.map((n) => n.id));
  const dimensions = options.dimensions;

  const originals = new Map(
    nodes.map((n) => [n.id, { x: n.x, y: n.y }] as const)
  );
  const positions = new Map(
    nodes.map((n) => [n.id, { x: n.x, y: n.y }] as const)
  );
  const touched = new Set<string>();

  for (let iter = 0; iter < maxIterations; iter++) {
    const deltas = new Map<string, { dx: number; dy: number }>();
    let resolvedAny = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const posA = positions.get(a.id)!;
        const posB = positions.get(b.id)!;
        const boundsA = getBounds({ ...a, ...posA }, padding, dimensions);
        const boundsB = getBounds({ ...b, ...posB }, padding, dimensions);
        const sep = separationForPair(boundsA, boundsB);
        if (!sep) continue;

        const aMovable = movable.has(a.id);
        const bMovable = movable.has(b.id);
        if (!aMovable && !bMovable) continue;

        resolvedAny = true;

        const addDelta = (id: string, dx: number, dy: number) => {
          const current = deltas.get(id) ?? { dx: 0, dy: 0 };
          deltas.set(id, { dx: current.dx + dx, dy: current.dy + dy });
        };

        if (aMovable && bMovable) {
          addDelta(a.id, sep.pushA.dx / 2, sep.pushA.dy / 2);
          addDelta(b.id, sep.pushB.dx / 2, sep.pushB.dy / 2);
        } else if (aMovable) {
          addDelta(a.id, sep.pushA.dx, sep.pushA.dy);
        } else {
          addDelta(b.id, sep.pushB.dx, sep.pushB.dy);
        }
      }
    }

    if (!resolvedAny) break;

    for (const [id, delta] of deltas) {
      const pos = positions.get(id)!;
      positions.set(id, { x: pos.x + delta.dx, y: pos.y + delta.dy });
      touched.add(id);
    }
  }

  for (let pass = 0; pass < 24; pass++) {
    let adjusted = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const posA = positions.get(a.id)!;
        const posB = positions.get(b.id)!;
        const boundsA = getBounds({ ...a, ...posA }, padding, dimensions);
        const boundsB = getBounds({ ...b, ...posB }, padding, dimensions);
        const sep = separationForPair(boundsA, boundsB);
        if (!sep) continue;

        const aMovable = movable.has(a.id);
        const bMovable = movable.has(b.id);
        if (!aMovable && !bMovable) continue;

        adjusted = true;
        touched.add(a.id);
        touched.add(b.id);

        if (aMovable && bMovable) {
          positions.set(a.id, {
            x: posA.x + sep.pushA.dx,
            y: posA.y + sep.pushA.dy,
          });
          positions.set(b.id, {
            x: posB.x + sep.pushB.dx,
            y: posB.y + sep.pushB.dy,
          });
        } else if (aMovable) {
          positions.set(a.id, {
            x: posA.x + sep.pushA.dx,
            y: posA.y + sep.pushA.dy,
          });
        } else {
          positions.set(b.id, {
            x: posB.x + sep.pushB.dx,
            y: posB.y + sep.pushB.dy,
          });
        }
      }
    }
    if (!adjusted) break;
  }

  const result = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const original = originals.get(node.id)!;
    if (!touched.has(node.id)) {
      result.set(node.id, original);
      continue;
    }
    const next = positions.get(node.id)!;
    result.set(node.id, { x: snap(next.x), y: snap(next.y) });
  }

  return result;
}

export function resolveMovableNearSeed(
  nodes: PositionedLayoutNode[],
  movableIds: ReadonlySet<string>,
  dimensions?: NodeDimensionMap
): Map<string, { x: number; y: number }> {
  const result = new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));

  for (const id of movableIds) {
    const node = nodes.find((n) => n.id === id);
    if (!node) continue;

    const others = nodes.filter((n) => n.id !== id);
    const next = findNonOverlappingPosition(
      node.kind,
      { x: node.x, y: node.y },
      others,
      { dimensions }
    );

    if (next.x !== node.x || next.y !== node.y) {
      result.set(id, next);
    }
  }

  return result;
}

export function hasAnyOverlap(
  nodes: PositionedLayoutNode[],
  options: CollisionResolveOptions = {}
): boolean {
  const padding = options.padding ?? COLLISION_PADDING;
  const dimensions = options.dimensions;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = getBounds(nodes[i]!, padding, dimensions);
      const b = getBounds(nodes[j]!, padding, dimensions);
      if (separationForPair(a, b)) return true;
    }
  }
  return false;
}

export function toPositionedNodes<
  T extends { id: string; position: { x: number; y: number }; data: { kind: NodeKind } },
>(nodes: T[]): PositionedLayoutNode[] {
  return nodes.map((n) => ({
    id: n.id,
    kind: n.data.kind,
    x: n.position.x,
    y: n.position.y,
  }));
}

export function applyCollisionPositions<
  T extends { id: string; position: { x: number; y: number }; data: { kind: NodeKind } },
>(nodes: T[], positions: Map<string, { x: number; y: number }>): T[] {
  return nodes.map((n) => {
    const next = positions.get(n.id);
    if (!next) return n;
    if (next.x === n.position.x && next.y === n.position.y) return n;
    return { ...n, position: next };
  });
}

const SEARCH_STEP = DEFAULT_COLUMN_STRIDE;

function searchOffsets(maxRings: number): { dx: number; dy: number }[] {
  const offsets: { dx: number; dy: number }[] = [{ dx: 0, dy: 0 }];

  for (let ring = 1; ring <= maxRings; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      offsets.push({ dx: dx * SEARCH_STEP, dy: 0 });
    }
    for (let dy = -ring; dy <= ring; dy++) {
      if (dy === 0) continue;
      offsets.push({ dx: 0, dy: dy * SEARCH_STEP });
    }
  }

  return offsets;
}

export function findNonOverlappingPosition(
  kind: NodeKind,
  seed: { x: number; y: number },
  existing: PositionedLayoutNode[],
  options: CollisionResolveOptions = {}
): { x: number; y: number } {
  const dimensions = options.dimensions;
  const snappedSeed = { x: snap(seed.x), y: snap(seed.y) };

  for (const offset of searchOffsets(12)) {
    const candidate: PositionedLayoutNode = {
      id: "__new__",
      kind,
      x: Math.max(LAYOUT_PADDING.x, snappedSeed.x + offset.dx),
      y: Math.max(LAYOUT_PADDING.y, snappedSeed.y + offset.dy),
    };
    if (!hasAnyOverlap([...existing, candidate], { dimensions, padding: options.padding })) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  const fallback = resolveNodeCollisions(
    [
      ...existing,
      { id: "__new__", kind, x: snappedSeed.x, y: snappedSeed.y },
    ],
    { movable: new Set(["__new__"]), dimensions, padding: options.padding }
  );

  return (
    fallback.get("__new__") ?? {
      x: snappedSeed.x,
      y: snappedSeed.y,
    }
  );
}
