import type { SongDefType } from "@/lib/schemas/song";
import { loadAllDrumSamples } from "../drums/sample-registry";
import type { SongLayerEngine } from "./song-layer-engine";

export type PrepareMultibusResult = {
  samplesLoaded: number;
};

/** Load layers, optional drum sends, and riddim WAV samples before playback (#109). */
export async function prepareMultibusEngine(
  engine: SongLayerEngine,
  song: SongDefType
): Promise<PrepareMultibusResult> {
  engine.loadFromSong(song);
  engine.setTransportBpm(song.meta.bpm);
  if (song.drums?.sendFx) {
    engine.setDrumSendFx(song.drums.sendFx);
  }
  const samplesLoaded = await loadAllDrumSamples(engine.ctx, engine.drumEngine);
  return { samplesLoaded };
}
