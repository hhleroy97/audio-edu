import type { SongDefType } from "@/lib/schemas/song";
import { compileMultibusSchedule } from "../multibus/compile-schedule";
import { dispatchMultibusAction } from "../multibus/audio-scheduler";
import { SongLayerEngine } from "../multibus/song-layer-engine";
import { songDurationSec } from "../timeline";

/** Render one layer in isolation for stem metrics (mix pass). */
export async function renderSoloLayerStem(
  song: SongDefType,
  layerId: string,
  sampleRate = 48000
): Promise<AudioBuffer | null> {
  const OfflineCtx =
    typeof globalThis.OfflineAudioContext !== "undefined"
      ? globalThis.OfflineAudioContext
      : null;
  if (!OfflineCtx || song.layers.length === 0) return null;

  const durationSec = songDurationSec(song);
  const frames = Math.ceil(durationSec * sampleRate);
  const ctx = new OfflineCtx(2, frames, sampleRate);
  const engine = new SongLayerEngine({ ctx, destination: ctx.destination });

  try {
    engine.loadFromSong(song);
    engine.setTransportBpm(song.meta.bpm);

    for (const id of engine.getLayerIds()) {
      engine.setLayerGain(id, id === layerId ? 1 : 0, 0);
    }

    const epoch = 0.05;
    const actions = compileMultibusSchedule(song, epoch, song.meta.bpm);
    await engine.startAll();

    const gateTimers = new Map<string, ReturnType<typeof setTimeout>>();
    for (const action of actions) {
      if (
        action.type === "layerGain" ||
        (action.type === "note" && action.layerId !== layerId) ||
        (action.type === "automation" && action.layerId !== layerId) ||
        (action.type === "layerPreset" && action.layerId !== layerId)
      ) {
        continue;
      }
      dispatchMultibusAction(engine, action, gateTimers);
    }

    return await ctx.startRendering();
  } finally {
    engine.dispose();
  }
}
