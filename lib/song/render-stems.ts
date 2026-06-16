import type { SongDefType } from "@/lib/schemas/song";
import { buildSongManifest, encodeWavPcm16, type SongManifest } from "./render-offline";
import { songDurationSec } from "./timeline";
import { compileMultibusSchedule } from "./multibus/compile-schedule";
import { dispatchMultibusAction } from "./multibus/audio-scheduler";
import { prepareMultibusEngine } from "./multibus/prepare-engine";
import { SongLayerEngine } from "./multibus/song-layer-engine";

export type StemManifestEntry = {
  layerId: string;
  presetId: string;
  durationSec: number;
  sampleRate: number;
};

export type StemRenderResult = {
  masterManifest: SongManifest;
  stems: StemManifestEntry[];
  masterBuffer: AudioBuffer | null;
  masterWavBytes: Uint8Array | null;
};

/** Offline multibus bounce — schedules all layer events then renders master bus. */
export async function renderMultibusStems(
  song: SongDefType,
  sampleRate = 48000
): Promise<StemRenderResult> {
  const durationSec = songDurationSec(song);
  const OfflineCtx =
    typeof globalThis.OfflineAudioContext !== "undefined"
      ? globalThis.OfflineAudioContext
      : null;

  const stems: StemManifestEntry[] = song.layers.map((l) => ({
    layerId: l.id,
    presetId: l.presetId,
    durationSec,
    sampleRate,
  }));

  const masterManifest: SongManifest = {
    ...buildSongManifest(song, sampleRate),
    renderedAt: new Date().toISOString(),
    durationSec,
  };

  if (!OfflineCtx || song.layers.length === 0) {
    return {
      masterManifest,
      stems,
      masterBuffer: null,
      masterWavBytes: null,
    };
  }

  const frames = Math.ceil(durationSec * sampleRate);
  const ctx = new OfflineCtx(2, frames, sampleRate);
  const engine = new SongLayerEngine({ ctx, destination: ctx.destination });

  try {
    await prepareMultibusEngine(engine, song);
    const epoch = 0.05;
    const actions = compileMultibusSchedule(song, epoch, song.meta.bpm);

    await engine.startAll();

    const gateTimers = new Map<string, ReturnType<typeof setTimeout>>();
    for (const action of actions) {
      dispatchMultibusAction(engine, action, gateTimers);
    }

    const masterBuffer = await ctx.startRendering();
    const masterWavBytes = encodeWavPcm16(masterBuffer, sampleRate);

    return { masterManifest, stems, masterBuffer, masterWavBytes };
  } finally {
    engine.dispose();
  }
}
