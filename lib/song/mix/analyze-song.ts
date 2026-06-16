import type { StemMetricsType } from "@/lib/schemas/mix";
import type { SongDefType } from "@/lib/schemas/song";
import { applyMixDefaultsToLayer } from "../multibus/mix-profiles";
import { renderMultibusStems } from "../render-stems";
import { analyzeAudioBuffer } from "./analyze-buffer";
import { renderSoloLayerStem } from "./render-solo-stem";

export type SongMixAnalysis = {
  sampleRate: number;
  stems: StemMetricsType[];
  masterPeak: number;
  masterRms: number;
};

/** Offline stem + master analysis for mix pass (phase 2). */
export async function analyzeSongMix(
  song: SongDefType,
  sampleRate = 48000
): Promise<SongMixAnalysis> {
  const stems: StemMetricsType[] = [];

  for (const raw of song.layers) {
    const layer = applyMixDefaultsToLayer(raw);
    const buffer = await renderSoloLayerStem(song, layer.id, sampleRate);
    if (!buffer) {
      stems.push({
        layerId: layer.id,
        mixProfile: layer.mixProfile,
        rms: 0,
        peak: 0,
        centroidHz: 0,
      });
      continue;
    }
    const metrics = analyzeAudioBuffer(buffer);
    stems.push({
      layerId: layer.id,
      mixProfile: layer.mixProfile,
      ...metrics,
    });
  }

  const master = await renderMultibusStems(song, sampleRate);
  let masterPeak = 0;
  let masterRms = 0;
  if (master.masterBuffer) {
    const m = analyzeAudioBuffer(master.masterBuffer);
    masterPeak = m.peak;
    masterRms = m.rms;
  }

  return { sampleRate, stems, masterPeak, masterRms };
}
