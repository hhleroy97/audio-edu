import { describe, expect, it } from "vitest";
import { riddim16Standard, riddim32Set } from "@/lib/song/templates/multibus-riddim";
import { lintSong } from "@/lib/song/lint-song";
import { validateSong } from "@/lib/song/validate-song";

describe("song lint v2", () => {
  it("validates all multibus templates", () => {
    for (const song of [riddim16Standard, riddim32Set]) {
      const { song: parsed } = validateSong(song);
      expect(lintSong(parsed).ok).toBe(true);
    }
  });

  it("fails unknown preset", () => {
    const bad = {
      ...riddim16Standard,
      layers: [{ id: "x", presetId: "not-a-real-preset", busGain: 0.5 }],
    };
    expect(lintSong(bad).ok).toBe(false);
  });
});
