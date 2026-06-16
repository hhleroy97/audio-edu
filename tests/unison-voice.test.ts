import { describe, expect, it } from "vitest";
import { voiceDetune, voiceLayout, voicePan } from "@/lib/audio/unison-voice";

describe("unison voice layout", () => {
  it("centers a single voice", () => {
    expect(voiceDetune(0, 1, 20)).toBe(0);
    expect(voicePan(0, 1, 1)).toBe(0);
  });

  it("spreads detune and pan across three voices", () => {
    expect(voiceDetune(0, 3, 15)).toBeCloseTo(-7.5, 5);
    expect(voiceDetune(2, 3, 15)).toBeCloseTo(7.5, 5);
    expect(voicePan(0, 3, 0.8)).toBeCloseTo(-0.8, 5);
    expect(voicePan(2, 3, 0.8)).toBeCloseTo(0.8, 5);
  });

  it("builds layout rows for the spread display", () => {
    const layout = voiceLayout(3, 15, 0.8);
    expect(layout).toHaveLength(3);
    expect(layout[1]?.detuneCents).toBe(0);
  });
});
