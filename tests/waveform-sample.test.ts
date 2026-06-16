import { describe, expect, it } from "vitest";
import { sampleWaveform } from "@/lib/viz/waveform-sample";

describe("waveform sampling", () => {
  it("samples sine at zero crossing and peak", () => {
    expect(sampleWaveform("sine", 0)).toBeCloseTo(0, 5);
    expect(sampleWaveform("sine", Math.PI / 2)).toBeCloseTo(1, 5);
  });

  it("samples square as bipolar", () => {
    expect(sampleWaveform("square", 0)).toBe(1);
    expect(sampleWaveform("square", Math.PI + 0.1)).toBe(-1);
  });

  it("samples sawtooth ramp", () => {
    expect(sampleWaveform("sawtooth", 0)).toBeCloseTo(-1, 5);
    expect(sampleWaveform("sawtooth", Math.PI)).toBeCloseTo(0, 5);
  });

  it("samples triangle with bounded output", () => {
    expect(sampleWaveform("triangle", 0)).toBeCloseTo(0, 5);
    expect(Math.abs(sampleWaveform("triangle", Math.PI / 2))).toBeLessThanOrEqual(1);
  });
});
