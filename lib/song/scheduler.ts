import type { SongDefType } from "@/lib/schemas/song";
import {
  beatToSeconds,
  flattenSongEvents,
  songDurationSec,
  songTotalBeats,
  type FlatScheduledEvent,
} from "./timeline";
import {
  buildLayerPresetMap,
  clearPatchNoteTimer,
  dispatchPatternEvent,
  type PatchSongBridge,
} from "./trigger-patch-note";

export type SongSchedulerProgress = {
  beat: number;
  totalBeats: number;
  sectionId: string;
  event: FlatScheduledEvent;
};

export type SongSchedulerOptions = {
  bridge: PatchSongBridge;
  onProgress?: (progress: SongSchedulerProgress) => void;
  onComplete?: () => void;
};

/** Beat-accurate scheduler — fires Pattern IR events into Patch Lab. */
export class SongScheduler {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private playing = false;
  private currentSectionId: string | null = null;

  constructor(private readonly options: SongSchedulerOptions) {}

  get isPlaying(): boolean {
    return this.playing;
  }

  get activeSectionId(): string | null {
    return this.currentSectionId;
  }

  async play(song: SongDefType): Promise<void> {
    this.stop();
    this.playing = true;

    const { bridge, onProgress, onComplete } = this.options;
    const { bpm } = song.meta;
    const totalBeats = songTotalBeats(song);

    bridge.setTransportBpm(bpm);
    await bridge.run();

    const events = flattenSongEvents(song);
    const sectionById = new Map(song.sections.map((s) => [s.id, s]));

    for (const event of events) {
      const delayMs = beatToSeconds(event.absoluteBeat, bpm) * 1000;
      const section = sectionById.get(event.sectionId);
      const layerPresets = buildLayerPresetMap(
        song.patches,
        section?.patches
      );

      const timer = setTimeout(() => {
        if (!this.playing) return;
        this.currentSectionId = event.sectionId;
        dispatchPatternEvent(bridge, event, bpm, layerPresets);
        onProgress?.({
          beat: event.absoluteBeat,
          totalBeats,
          sectionId: event.sectionId,
          event,
        });
      }, delayMs);
      this.timers.push(timer);
    }

    const endMs = beatToSeconds(totalBeats, bpm) * 1000;
    this.timers.push(
      setTimeout(() => {
        this.stop();
        onComplete?.();
      }, endMs + 50)
    );
  }

  stop(): void {
    this.playing = false;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    clearPatchNoteTimer();
    this.options.bridge.stop();
    this.currentSectionId = null;
  }
}

/** One-bar golden timeline helper for tests. */
export function scheduleBarTimeline(
  song: SongDefType,
  barIndex: number
): { beat: number; kind: string; layer?: string }[] {
  const beatsPerBar = song.meta.beatsPerBar;
  const start = barIndex * beatsPerBar;
  const end = start + beatsPerBar;
  return flattenSongEvents(song)
    .filter((e) => e.absoluteBeat >= start && e.absoluteBeat < end)
    .map((e) => ({
      beat: e.absoluteBeat,
      kind: e.kind,
      layer: e.layer,
    }));
}

export { songDurationSec, songTotalBeats };
