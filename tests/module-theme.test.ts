import { describe, expect, it } from "vitest";
import { MODULE_THEME, getModuleTheme } from "@/lib/patch/module-theme";

describe("module-theme", () => {
  it("assigns unique module codes per kind", () => {
    const codes = Object.values(MODULE_THEME).map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("uses asymmetric clip paths for each module", () => {
    const clips = Object.values(MODULE_THEME).map((t) => t.clipPath);
    expect(new Set(clips).size).toBe(clips.length);
  });

  it("falls back to oscillator theme for unknown kinds", () => {
    expect(getModuleTheme("oscillator").code).toBe("VCO");
  });
});
