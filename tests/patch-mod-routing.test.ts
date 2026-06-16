import { describe, expect, it } from "vitest";
import {
  DEFAULT_CV_EDGE_DATA,
  normalizeModDepth,
  parseCvEdgeData,
  PatchEdgeData,
} from "@/lib/schemas/patch-edge-data";
import { getUnipolarCurve } from "@/lib/patch/cv-routing";
import { presetToPatch } from "@/lib/patch/presets/load";

describe("patch mod routing", () => {
  it("validates PatchEdgeData schema", () => {
    const parsed = PatchEdgeData.parse({
      signal: "cv",
      modDepth: 0.5,
      modOffset: -0.2,
      modBipolar: true,
    });
    expect(parsed.modDepth).toBe(0.5);
  });

  it("migrates legacy unipolar depth 0..2 to bipolar", () => {
    expect(normalizeModDepth(1.6)).toBeCloseTo(0.8);
    expect(normalizeModDepth(0.5)).toBe(0.5);
    expect(normalizeModDepth(undefined)).toBe(DEFAULT_CV_EDGE_DATA.modDepth);
  });

  it("parseCvEdgeData applies defaults", () => {
    const cv = parseCvEdgeData({ signal: "cv" });
    expect(cv.modBipolar).toBe(true);
    expect(cv.modDepth).toBe(DEFAULT_CV_EDGE_DATA.modDepth);
  });

  it("unipolar curve rectifies negative values", () => {
    const curve = getUnipolarCurve();
    expect(curve[0]).toBe(0);
    expect(curve[128]).toBeCloseTo(0, 1);
    expect(curve[200]).toBeGreaterThan(0);
  });

  it("pitch-bite preset loads with CV edge to oscillator pitch", () => {
    const patch = presetToPatch("pitch-bite");
    expect(patch).not.toBeNull();
    const cvEdge = patch!.edges.find((e) => e.targetHandle === "cv-freq");
    expect(cvEdge?.signal).toBe("cv");
  });
});
