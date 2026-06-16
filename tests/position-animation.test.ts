import { describe, expect, it } from "vitest";
import {
  hasMovableOverlap,
  stepRepulsion,
  stepSpringToTargets,
  type RepulsionParticle,
} from "@/lib/patch/position-animation";

function makeParticles(
  defs: Array<{
    id: string;
    kind: "oscillator" | "output" | "filter";
    x: number;
    y: number;
    movable?: boolean;
  }>
): RepulsionParticle[] {
  return defs.map((d) => ({
    id: d.id,
    kind: d.kind,
    x: d.x,
    y: d.y,
    vx: 0,
    vy: 0,
    movable: d.movable ?? false,
  }));
}

describe("stepRepulsion", () => {
  it("does not move separated nodes", () => {
    const particles = makeParticles([
      { id: "a", kind: "oscillator", x: 64, y: 80 },
      { id: "b", kind: "output", x: 500, y: 80 },
    ]);

    stepRepulsion(particles);
    expect(particles[0]!.x).toBe(64);
    expect(particles[1]!.x).toBe(500);
  });

  it("pushes overlapping movable nodes apart over multiple steps", () => {
    const particles = makeParticles([
      { id: "a", kind: "oscillator", x: 64, y: 80, movable: true },
      { id: "b", kind: "filter", x: 120, y: 80, movable: true },
    ]);

    for (let i = 0; i < 24; i++) stepRepulsion(particles);

    expect(particles[1]!.x - particles[0]!.x).toBeGreaterThan(180);
    expect(
      hasMovableOverlap(
        particles.map((p) => ({ id: p.id, kind: p.kind, x: p.x, y: p.y })),
        new Set(["a", "b"])
      )
    ).toBe(false);
  });

  it("only displaces the movable node when the other is pinned", () => {
    const particles = makeParticles([
      { id: "a", kind: "oscillator", x: 64, y: 80, movable: false },
      { id: "b", kind: "filter", x: 120, y: 80, movable: true },
    ]);

    for (let i = 0; i < 30; i++) stepRepulsion(particles);

    expect(particles[0]!.x).toBe(64);
    expect(particles[1]!.x).toBeGreaterThan(280);
  });
});

describe("stepSpringToTargets", () => {
  it("eases particles toward target positions", () => {
    const particles = makeParticles([
      { id: "a", kind: "filter", x: 100, y: 80, movable: true },
    ]);
    const targets = new Map([["a", { x: 300, y: 80 }]]);

    for (let i = 0; i < 40; i++) {
      stepSpringToTargets(particles, targets);
    }

    expect(particles[0]!.x).toBeGreaterThan(250);
  });
});
