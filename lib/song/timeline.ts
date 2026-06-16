import type {
  PatternEventType,
  SectionDefType,
  SongDefType,
} from "@/lib/schemas/song";

export type FlatScheduledEvent = PatternEventType & {
  sectionId: string;
  absoluteBeat: number;
};

/** Seconds from song start for a beat index at `bpm`. */
export function beatToSeconds(beat: number, bpm: number): number {
  return (beat * 60) / bpm;
}

/** Absolute beat index from bar + beat-in-bar. */
export function barBeatToAbsolute(
  beatInBar: number,
  bar: number,
  beatsPerBar: number
): number {
  return bar * beatsPerBar + beatInBar;
}

/** Total beats spanned by song meta. */
export function songTotalBeats(song: SongDefType): number {
  return song.meta.bars * song.meta.beatsPerBar;
}

/** Song duration in seconds from meta bars + bpm. */
export function songDurationSec(song: SongDefType): number {
  return beatToSeconds(songTotalBeats(song), song.meta.bpm);
}

/** Offset section-local beat to absolute timeline beat. */
export function sectionLocalBeatToAbsolute(
  section: SectionDefType,
  localBeat: number,
  beatsPerBar: number
): number {
  return barBeatToAbsolute(localBeat, section.startBar, beatsPerBar);
}

/** Flatten all section events onto one absolute beat timeline (sorted). */
export function flattenSongEvents(song: SongDefType): FlatScheduledEvent[] {
  const beatsPerBar = song.meta.beatsPerBar;
  const flat: FlatScheduledEvent[] = [];

  for (const section of song.sections) {
    for (const event of section.events) {
      flat.push({
        ...event,
        sectionId: section.id,
        absoluteBeat: sectionLocalBeatToAbsolute(
          section,
          event.beat,
          beatsPerBar
        ),
      });
    }
  }

  flat.sort((a, b) => a.absoluteBeat - b.absoluteBeat);
  return flat;
}

/** Golden timeline for tests — beat + kind pairs for one bar window. */
export function eventsInBar(
  song: SongDefType,
  barIndex: number
): FlatScheduledEvent[] {
  const beatsPerBar = song.meta.beatsPerBar;
  const start = barIndex * beatsPerBar;
  const end = start + beatsPerBar;
  return flattenSongEvents(song).filter(
    (e) => e.absoluteBeat >= start && e.absoluteBeat < end
  );
}
