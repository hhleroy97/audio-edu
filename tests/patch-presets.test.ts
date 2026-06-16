import { describe, expect, it } from "vitest";
import { PatchPreset } from "@/lib/schemas/patch";
import { PATCH_PRESETS, getPatchPreset } from "@/lib/patch/presets/index";
import { presetToPatch } from "@/lib/patch/presets/load";

describe("patch presets", () => {
  it("validates all bundled presets", () => {
    for (const preset of PATCH_PRESETS) {
      expect(() => PatchPreset.parse(preset)).not.toThrow();
    }
  });

  it("layouts clean-sub into a playable patch", () => {
    const patch = presetToPatch("clean-sub");
    expect(patch).not.toBeNull();
    expect(patch!.nodes.some((n) => n.type === "oscillator")).toBe(true);
    expect(patch!.nodes.length).toBeGreaterThanOrEqual(3);
    expect(patch!.edges.length).toBeGreaterThanOrEqual(2);
  });

  it("wobble-stub wires LFO cv to filter cutoff", () => {
    const patch = presetToPatch("wobble-stub");
    expect(patch).not.toBeNull();
    const cvEdge = patch!.edges.find(
      (e) => e.sourceHandle === "cv-out" && e.targetHandle === "cv-cutoff"
    );
    expect(cvEdge).toBeDefined();
    expect(cvEdge!.signal).toBe("cv");
  });

  it("pitch-bite wires envelope cv to oscillator pitch", () => {
    const patch = presetToPatch("pitch-bite");
    expect(patch).not.toBeNull();
    const cvEdge = patch!.edges.find(
      (e) => e.sourceHandle === "cv-out" && e.targetHandle === "cv-freq"
    );
    expect(cvEdge).toBeDefined();
  });

  it("sub-body-stack uses mixer inputs", () => {
    const patch = presetToPatch("sub-body-stack");
    expect(patch).not.toBeNull();
    const mixEdges = patch!.edges.filter((e) => e.targetHandle?.startsWith("audio-in-"));
    expect(mixEdges.length).toBeGreaterThanOrEqual(2);
  });

  it("bundles thirty-five presets", () => {
    expect(PATCH_PRESETS.length).toBe(35);
  });

  it("loads gnarly archetype hydraulic-press-wobble", () => {
    const patch = presetToPatch("hydraulic-press-wobble");
    expect(patch).not.toBeNull();
    expect(patch!.nodes.some((n) => n.type === "distortion")).toBe(true);
  });

  it("loads dsf-allpass-comb dual modFx chain", () => {
    const patch = presetToPatch("dsf-allpass-comb");
    expect(patch).not.toBeNull();
    expect(patch!.nodes.filter((n) => n.type === "modFx").length).toBe(2);
  });

  it("fm-growl-stub wires LFO cv to FM index", () => {
    const patch = presetToPatch("fm-growl-stub");
    expect(patch).not.toBeNull();
    const cvEdge = patch!.edges.find(
      (e) => e.targetHandle === "cv-index" && e.sourceHandle === "cv-out"
    );
    expect(cvEdge).toBeDefined();
  });

  it("riddim-layer-stack uses layerStack sub input", () => {
    const patch = presetToPatch("riddim-layer-stack");
    expect(patch).not.toBeNull();
    expect(
      patch!.edges.some((e) => e.targetHandle === "audio-in-sub")
    ).toBe(true);
  });

  it("resolves presets by id", () => {
    expect(getPatchPreset("saw-body")?.title).toBe("Saw Body");
    expect(getPatchPreset("missing")).toBeUndefined();
  });
});
