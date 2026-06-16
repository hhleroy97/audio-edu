import { describe, expect, it } from "vitest";
import {
  buildPatchCablePath,
  cableEndpointAngle,
} from "@/lib/patch/cable-path";

describe("buildPatchCablePath", () => {
  it("starts and ends at jack anchor points", () => {
    const path = buildPatchCablePath(100, 50, 300, 80);
    expect(path.startsWith("M 100 50")).toBe(true);
    expect(path.endsWith("300 80")).toBe(true);
  });

  it("drops vertically from forward-facing jacks", () => {
    const path = buildPatchCablePath(100, 50, 300, 50);
    expect(path).toMatch(/L 100 \d+/);
  });
});

describe("cableEndpointAngle", () => {
  it("points plugs into faceplate jacks from below", () => {
    expect(cableEndpointAngle(100, 50, 300, 50, "start")).toBe(90);
    expect(cableEndpointAngle(100, 50, 300, 50, "end")).toBe(270);
  });
});

describe("jackSlotPercent", () => {
  it("centers a single input jack on the left cluster", async () => {
    const { jackSlotPercent } = await import("@/lib/patch/ModuleJack");
    expect(jackSlotPercent(0, 1, "in")).toBe("27%");
  });

  it("centers a single output jack on the right cluster", async () => {
    const { jackSlotPercent } = await import("@/lib/patch/ModuleJack");
    expect(jackSlotPercent(0, 1, "out")).toBe("73%");
  });
});
