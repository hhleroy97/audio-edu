import { describe, expect, it } from "vitest";
import { riddimDropMinimal } from "@/lib/song/templates";
import {
  buildSongManifest,
  hashSongInputs,
  renderSongOffline,
  encodeWavPcm16,
  collectPresetIds,
} from "@/lib/song/render-offline";

describe("song offline render", () => {
  it("builds manifest with preset ids and duration", () => {
    const manifest = buildSongManifest(riddimDropMinimal);
    expect(manifest.songId).toBe("riddim-drop-minimal");
    expect(manifest.bpm).toBe(140);
    expect(manifest.durationSec).toBeCloseTo((16 * 60) / 140, 3);
    expect(collectPresetIds(riddimDropMinimal)).toContain("clean-sub");
    expect(manifest.presetIds).toContain("clean-sub");
    expect(manifest.inputsHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("hash is stable for same inputs", () => {
    const a = hashSongInputs(riddimDropMinimal);
    const b = hashSongInputs(riddimDropMinimal);
    expect(a).toBe(b);
  });

  it("smoke render caps at 2s", async () => {
    const result = await renderSongOffline(riddimDropMinimal, {
      maxDurationSec: 2,
    });
    expect(result.manifest.durationSec).toBe(2);
    expect(result.manifest.sections.length).toBeGreaterThan(0);
    if (result.buffer) {
      expect(result.buffer.duration).toBeLessThanOrEqual(2.01);
      expect(result.wavBytes).not.toBeNull();
      expect(result.wavBytes!.length).toBeGreaterThan(44);
      expect(encodeWavPcm16(result.buffer).length).toBe(result.wavBytes!.length);
    }
  });
});
