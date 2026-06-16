import { describe, expect, it } from "vitest";
import { euclideanRhythm, euclideanBeatHits } from "@/lib/song/pattern/euclidean";
import {
  midiFromScaleDegree,
  scaleNotesForKey,
} from "@/lib/song/pattern/tonal-notes";
import {
  runArrangement,
  regenerateSection,
  RIDDIM_STANDARD_16,
} from "@/lib/song/agents";
import { hashSongInputs } from "@/lib/song/render-offline";
import { lintSong } from "@/lib/song/lint-song";

describe("euclidean rhythm", () => {
  it("distributes 3 pulses across 8 steps", () => {
    const hits = euclideanRhythm(3, 8);
    expect(hits).toHaveLength(3);
    expect(new Set(hits).size).toBe(3);
  });

  it("maps to beat grid", () => {
    const beats = euclideanBeatHits(3, 8, 1, 4, 0, 0);
    expect(beats.length).toBeGreaterThan(0);
  });
});

describe("tonal notes", () => {
  it("resolves F# minor pentatonic scale", () => {
    const notes = scaleNotesForKey("F#", "minor pentatonic");
    expect(notes.length).toBeGreaterThanOrEqual(5);
    expect(notes[0]).toMatch(/F#|Gb/);
  });

  it("maps scale degree to MIDI", () => {
    const midi = midiFromScaleDegree("F#", "minor pentatonic", 1, 1);
    expect(midi).toBeGreaterThanOrEqual(24);
    expect(midi).toBeLessThanOrEqual(127);
  });
});

describe("arrangement agent", () => {
  it("generates valid SongDef from rule pack + seed", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "test-seed",
    });
    expect(run.song.meta.bars).toBe(16);
    expect(run.song.layers.length).toBeGreaterThanOrEqual(2);
    expect(run.song.drums?.hits.length).toBeGreaterThan(0);
    expect(run.inputsHash).toMatch(/^[0-9a-f]{8}$/);
    const lint = lintSong(run.song);
    expect(lint.ok).toBe(true);
  });

  it("is deterministic for same seed", () => {
    const a = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "deterministic",
    });
    const b = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "deterministic",
    });
    expect(hashSongInputs(a.song)).toBe(hashSongInputs(b.song));
  });

  it("varies with different seeds", () => {
    const a = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "seed-a",
    });
    const b = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "seed-b",
    });
    expect(hashSongInputs(a.song)).not.toBe(hashSongInputs(b.song));
  });

  it("emits sub-agent progress events", () => {
    const events: string[] = [];
    runArrangement(
      { rulePackId: RIDDIM_STANDARD_16.id, seed: "events" },
      (ev) => events.push(`${ev.agent}:${ev.phase}`)
    );
    expect(events).toContain("section:done");
    expect(events).toContain("pattern:done");
    expect(events).toContain("drum:done");
    expect(events).toContain("automation:done");
  });

  it("regenerates a single section", () => {
    const run = runArrangement({
      rulePackId: RIDDIM_STANDARD_16.id,
      seed: "regen-base",
    });
    const regen = regenerateSection({
      request: { rulePackId: RIDDIM_STANDARD_16.id, seed: "regen-base" },
      sectionId: "drop-a",
      baseSong: run.song,
    });
    const drop = regen.sections.find((s) => s.id === "drop-a");
    expect(drop?.events.length).toBeGreaterThan(0);
    expect(lintSong(regen).ok).toBe(true);
  });
});
