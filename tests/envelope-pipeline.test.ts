import { describe, expect, it } from "vitest";
import {
  DEFAULT_AMPLITUDE_ADSR,
  sampleAmplitudeEnvelope,
} from "@/lib/audio/adsr-amplitude";
import { hasAudioPath } from "@/lib/patch/tour-utils";

describe("amplitude envelope", () => {
  it("ramps through ADSR stages", () => {
    const samples = sampleAmplitudeEnvelope(DEFAULT_AMPLITUDE_ADSR);
    expect(samples[0]?.level).toBeCloseTo(0, 2);
    expect(Math.max(...samples.map((s) => s.level))).toBeCloseTo(1, 1);
    expect(samples[samples.length - 1]?.level).toBeCloseTo(0, 1);
  });
});

describe("envelope pipeline path", () => {
  it("detects osc → detune → envelope → output", () => {
    const edges = [
      { source: "osc-1", target: "det-1" },
      { source: "det-1", target: "env-1" },
      { source: "env-1", target: "out-1" },
    ];
    expect(hasAudioPath(edges, "osc-1", "out-1")).toBe(true);
  });
});
