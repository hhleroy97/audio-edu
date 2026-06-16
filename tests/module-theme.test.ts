import { describe, expect, it } from "vitest";
import { MODULE_THEME, getModuleTheme } from "@/lib/patch/module-theme";

describe("module-theme", () => {
  it("assigns unique module codes per kind", () => {
    const codes = Object.values(MODULE_THEME).map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("uses short uppercase codes for flat UI badges", () => {
    for (const theme of Object.values(MODULE_THEME)) {
      expect(theme.code).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("falls back to oscillator theme for unknown kinds", () => {
    expect(getModuleTheme("oscillator").code).toBe("VCO");
  });
});
