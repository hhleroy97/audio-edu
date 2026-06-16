import { describe, expect, it } from "vitest";
import riddimDropJson from "../songs/riddim-drop-01.json";
import { SongDef } from "@/lib/schemas/song";
import { validateSong } from "@/lib/song/validate-song";
import { riddimDrop01, SONG_TEMPLATES } from "@/lib/song/templates";

describe("song schema", () => {
  it("parses riddim-drop-01.json", () => {
    const { song, warnings } = validateSong(riddimDropJson);
    expect(song.meta.id).toBe("riddim-drop-01");
    expect(song.meta.bpm).toBe(140);
    expect(song.meta.bars).toBe(8);
    expect(song.patches).toHaveLength(2);
    expect(warnings).toHaveLength(0);
  });

  it("validates built-in templates", () => {
    for (const t of SONG_TEMPLATES) {
      const parsed = SongDef.parse(t.song);
      expect(parsed.meta.id).toBe(t.id);
    }
  });

  it("repairs missing meta defaults", () => {
    const { song, repaired } = validateSong({
      meta: { id: "x", title: "X", bars: 4 },
      patches: [{ layer: "sub", presetId: "clean-sub" }],
      sections: [{ id: "a", label: "A", startBar: 0, endBar: 4, events: [] }],
    });
    expect(repaired).toBe(true);
    expect(song.meta.bpm).toBe(140);
    expect(song.meta.beatsPerBar).toBe(4);
  });

  it("matches template and JSON example", () => {
    const fromJson = validateSong(riddimDropJson).song;
    expect(fromJson.meta.id).toBe(riddimDrop01.meta.id);
    expect(fromJson.sections[0]?.events.length).toBe(
      riddimDrop01.sections[0]?.events.length
    );
  });
});
