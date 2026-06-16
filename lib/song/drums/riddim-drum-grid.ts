import type { DrumHitType, SectionDefType, SongDefType } from "@/lib/schemas/song";
import { DEFAULT_SIDECHAIN } from "@/lib/schemas/drums";

export type RiddimDrumGridOptions = {
  bars: number;
  beatsPerBar?: number;
  /** Include snare on beat 1 (backbeat ghost) per bar. */
  includeSnare?: boolean;
  /** Section ids where drums are muted (intro/build/break). */
  muteSectionIds?: string[];
  kickVelocity?: number;
  snareVelocity?: number;
};

/** Halftime riddim pocket — kick on beats 0 & 2, optional snare ghost on beat 1. */
export function buildRiddimDrumGrid(
  options: RiddimDrumGridOptions
): DrumHitType[] {
  const {
    bars,
    beatsPerBar = 4,
    includeSnare = true,
    kickVelocity = 0.88,
    snareVelocity = 0.55,
  } = options;

  const hits: DrumHitType[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (const beat of [0, 2]) {
      hits.push({
        beat: bar * beatsPerBar + beat,
        sampleId: "kick",
        velocity: kickVelocity,
      });
    }
    if (includeSnare) {
      hits.push({
        beat: bar * beatsPerBar + 1,
        sampleId: "snare",
        velocity: snareVelocity,
      });
    }
  }
  return hits;
}

/** Attach riddim drum lane + sidechain if song has no drums yet. */
export function ensureRiddimDrums(
  song: SongDefType,
  options?: Partial<RiddimDrumGridOptions>
): SongDefType {
  if (song.drums && song.drums.hits.length > 0) {
    return song;
  }

  const muteIds = new Set(options?.muteSectionIds ?? []);
  const hits: DrumHitType[] = [];

  for (const section of song.sections) {
    if (muteIds.has(section.id)) continue;
    const sectionBars = section.endBar - section.startBar;
    const sectionStartBeat = section.startBar * song.meta.beatsPerBar;
    const sectionHits = buildRiddimDrumGrid({
      bars: sectionBars,
      beatsPerBar: song.meta.beatsPerBar,
      includeSnare: section.id.includes("drop") || section.id.includes("build"),
      ...options,
    });
    for (const hit of sectionHits) {
      hits.push({
        ...hit,
        beat: sectionStartBeat + hit.beat,
      });
    }
  }

  return {
    ...song,
    drums: {
      hits,
      sidechain: song.drums?.sidechain ?? DEFAULT_SIDECHAIN,
    },
  };
}

/** Per-section drum hits for legacy section.drumHits field (optional). */
export function sectionDrumHitsForDrop(
  localBars: number,
  beatsPerBar = 4
): SectionDefType["drumHits"] {
  return buildRiddimDrumGrid({ bars: localBars, beatsPerBar }).map((h) => ({
    ...h,
    beat: h.beat,
  }));
}
