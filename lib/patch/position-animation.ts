import { snapGrid } from "./layout-constants";
import {
  COLLISION_PADDING,
  getPairSeparation,
  hasAnyOverlap,
  resolveMovableNearSeed,
  type PositionedLayoutNode,
} from "./collision-layout";
import type { NodeDimensionMap } from "./node-layout";

export type RepulsionParticle = PositionedLayoutNode & {
  vx: number;
  vy: number;
  movable: boolean;
};

export type RepulsionStepOptions = {
  padding?: number;
  forceScale?: number;
  damping?: number;
  dimensions?: NodeDimensionMap;
};

export const REPULSION_DEFAULTS = {
  /** Overlap push strength — lower = gentler nudge apart */
  forceScale: 0.22,
  /** Velocity decay per frame — higher = less momentum / overshoot */
  damping: 0.9,
  maxDurationMs: 480,
  settleVelocity: 0.12,
  /** Per-frame lerp toward resolved target (ease-out settle, no bounce) */
  easeFactor: 0.16,
  /** Cap px/frame so nodes never launch across the canvas */
  maxSpeed: 9,
};

function clampVelocity(vx: number, vy: number, maxSpeed: number): { vx: number; vy: number } {
  const speed = Math.hypot(vx, vy);
  if (speed <= maxSpeed) return { vx, vy };
  const scale = maxSpeed / speed;
  return { vx: vx * scale, vy: vy * scale };
}

export function stepRepulsion(
  particles: RepulsionParticle[],
  options: RepulsionStepOptions = {}
): boolean {
  const padding = options.padding ?? COLLISION_PADDING;
  const forceScale = options.forceScale ?? REPULSION_DEFAULTS.forceScale;
  const damping = options.damping ?? REPULSION_DEFAULTS.damping;
  const dimensions = options.dimensions;

  const fx = new Map<string, number>();
  const fy = new Map<string, number>();

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]!;
      const b = particles[j]!;
      const sep = getPairSeparation(a, b, padding, dimensions);
      if (!sep) continue;

      const aMovable = a.movable;
      const bMovable = b.movable;
      if (!aMovable && !bMovable) continue;

      const distribute = (id: string, dx: number, dy: number, movable: boolean) => {
        if (!movable) return;
        const scale = aMovable && bMovable ? 0.5 : 1;
        fx.set(id, (fx.get(id) ?? 0) + dx * scale);
        fy.set(id, (fy.get(id) ?? 0) + dy * scale);
      };

      distribute(a.id, sep.pushA.dx, sep.pushA.dy, aMovable);
      distribute(b.id, sep.pushB.dx, sep.pushB.dy, bMovable);
    }
  }

  let moving = false;

  for (const particle of particles) {
    if (!particle.movable) continue;

    const ax = (fx.get(particle.id) ?? 0) * forceScale;
    const ay = (fy.get(particle.id) ?? 0) * forceScale;

    particle.vx = (particle.vx + ax) * damping;
    particle.vy = (particle.vy + ay) * damping;
    const clamped = clampVelocity(particle.vx, particle.vy, REPULSION_DEFAULTS.maxSpeed);
    particle.vx = clamped.vx;
    particle.vy = clamped.vy;
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (
      Math.abs(particle.vx) > REPULSION_DEFAULTS.settleVelocity ||
      Math.abs(particle.vy) > REPULSION_DEFAULTS.settleVelocity
    ) {
      moving = true;
    }
  }

  return moving;
}

function particlesToMap(particles: RepulsionParticle[]): Map<string, { x: number; y: number }> {
  return new Map(particles.map((p) => [p.id, { x: p.x, y: p.y }]));
}

function createParticles(
  nodes: PositionedLayoutNode[],
  movableIds: ReadonlySet<string>
): RepulsionParticle[] {
  return nodes.map((node) => ({
    ...node,
    vx: 0,
    vy: 0,
    movable: movableIds.has(node.id),
  }));
}

/** Smooth ease-out drift to resolved targets — no spring overshoot. */
export function stepEaseTowardTargets(
  particles: RepulsionParticle[],
  targets: Map<string, { x: number; y: number }>
): boolean {
  let moving = false;
  const t = REPULSION_DEFAULTS.easeFactor;

  for (const particle of particles) {
    if (!particle.movable) continue;
    const target = targets.get(particle.id);
    if (!target) continue;

    const dx = target.x - particle.x;
    const dy = target.y - particle.y;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      moving = true;
    }

    particle.x += dx * t;
    particle.y += dy * t;
    particle.vx = 0;
    particle.vy = 0;
  }

  return moving;
}

/** @deprecated Use stepEaseTowardTargets — kept for tests */
export function stepSpringToTargets(
  particles: RepulsionParticle[],
  targets: Map<string, { x: number; y: number }>
): boolean {
  return stepEaseTowardTargets(particles, targets);
}

export function hasMovableOverlap(
  nodes: PositionedLayoutNode[],
  movableIds: ReadonlySet<string>,
  padding = COLLISION_PADDING,
  dimensions?: NodeDimensionMap
): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      if (!movableIds.has(a.id) && !movableIds.has(b.id)) continue;
      if (getPairSeparation(a, b, padding, dimensions)) return true;
    }
  }
  return false;
}

export type RepulsionAnimationOptions = {
  maxDurationMs?: number;
  dimensions?: NodeDimensionMap;
  onUpdate: (positions: Map<string, { x: number; y: number }>) => void;
  onComplete: (positions: Map<string, { x: number; y: number }>) => void;
};

export function animateRepulsion(
  nodes: PositionedLayoutNode[],
  movableIds: ReadonlySet<string>,
  options: RepulsionAnimationOptions
): () => void {
  const dimensions = options.dimensions;
  const particles = createParticles(nodes, movableIds);
  const targets = resolveMovableNearSeed(nodes, movableIds, dimensions);
  const maxDurationMs = options.maxDurationMs ?? REPULSION_DEFAULTS.maxDurationMs;
  const start = performance.now();
  let raf = 0;
  let phase: "repulse" | "ease" = "repulse";

  const tick = (now: number) => {
    const moving =
      phase === "repulse"
        ? stepRepulsion(particles, { dimensions })
        : stepEaseTowardTargets(particles, targets);

    options.onUpdate(particlesToMap(particles));

    const elapsed = now - start;
    const settled =
      phase === "ease" &&
      !moving &&
      !hasAnyOverlap(
        particles.map(({ id, kind, x, y }) => ({ id, kind, x, y })),
        { dimensions }
      );

    if (settled || elapsed >= maxDurationMs) {
      const final = new Map<string, { x: number; y: number }>();
      for (const particle of particles) {
        const target = targets.get(particle.id);
        final.set(
          particle.id,
          target
            ? { x: snapGrid(target.x), y: snapGrid(target.y) }
            : { x: snapGrid(particle.x), y: snapGrid(particle.y) }
        );
      }
      options.onComplete(final);
      return;
    }

    if (
      phase === "repulse" &&
      !moving &&
      !hasMovableOverlap(
        particles.map(({ id, kind, x, y }) => ({ id, kind, x, y })),
        movableIds,
        COLLISION_PADDING,
        dimensions
      )
    ) {
      phase = "ease";
    }

    if (phase === "repulse" && elapsed > maxDurationMs * 0.35) {
      phase = "ease";
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
