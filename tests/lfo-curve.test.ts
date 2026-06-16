import { describe, expect, it } from "vitest";
import { sampleHoldAt, buildSampleHoldWave } from "@/lib/patch/lfo-curve";

describe("lfo curve", () => {
  it("sampleHoldAt quantizes to steps", () => {
    const a = sampleHoldAt(4, 0.1);
    const b = sampleHoldAt(4, 0.11);
    expect(a).toBe(b);
    const c = sampleHoldAt(4, 0.3);
    expect(c).not.toBe(a);
  });

  it("buildSampleHoldWave returns PeriodicWave in browser context", () => {
    if (typeof AudioContext === "undefined") return;
    const ctx = new AudioContext();
    const wave = buildSampleHoldWave(ctx, 6);
    expect(wave).toBeDefined();
    ctx.close();
  });
});
