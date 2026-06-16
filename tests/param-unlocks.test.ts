import { describe, expect, it } from "vitest";
import { isParamUnlocked, unlockedParamCount } from "@/lib/patch/param-unlocks";

describe("param-unlocks", () => {
  it("shows all params in playground mode", () => {
    expect(
      isParamUnlocked("detune", "spread", {
        mode: "playground",
        lessonSlug: "01-oscillator",
        tourStepIndex: 0,
      })
    ).toBe(true);
  });

  it("hides oscillator level fader until step 1 in lesson 01", () => {
    const ctx = {
      mode: "guided" as const,
      lessonSlug: "01-oscillator",
      tourStepIndex: 0,
    };
    expect(isParamUnlocked("oscillator", "gain", ctx)).toBe(false);
    expect(
      isParamUnlocked("oscillator", "gain", { ...ctx, tourStepIndex: 1 })
    ).toBe(true);
  });

  it("unlocks detune spread after spread explain step", () => {
    const ctx = {
      mode: "guided" as const,
      lessonSlug: "02-unison",
      tourStepIndex: 0,
    };
    expect(isParamUnlocked("detune", "voices", ctx)).toBe(true);
    expect(isParamUnlocked("detune", "spread", ctx)).toBe(false);
    expect(
      isParamUnlocked("detune", "spread", { ...ctx, tourStepIndex: 1 })
    ).toBe(true);
  });

  it("unlocks prior-lesson params when on a later lesson", () => {
    expect(
      isParamUnlocked("oscillator", "gain", {
        mode: "guided",
        lessonSlug: "02-unison",
        tourStepIndex: 0,
      })
    ).toBe(true);
  });

  it("counts unlocked envelope ADSR knobs progressively", () => {
    const params = ["attack", "decay", "sustain", "release", "gain"];
    const early = unlockedParamCount("envelope", params, {
      mode: "guided",
      lessonSlug: "03-envelope",
      tourStepIndex: 0,
    });
    const adsr = unlockedParamCount("envelope", params, {
      mode: "guided",
      lessonSlug: "03-envelope",
      tourStepIndex: 1,
    });
    expect(early).toBe(0);
    expect(adsr).toBe(4);
  });
});
