import type {
  LayerMixAdjustType,
  MasterMixAdjustType,
  MixDefType,
  StemMetricsType,
} from "@/lib/schemas/mix";
import { MixDef } from "@/lib/schemas/mix";
import type { MixProfileType, SongDefType } from "@/lib/schemas/song";
import {
  applyMixDefaultsToLayer,
  stripConfigForProfile,
} from "../multibus/mix-profiles";
import type { SongMixAnalysis } from "./analyze-song";

const MAX_BUS_GAIN: Record<MixProfileType, number> = {
  sub: 0.78,
  body: 0.62,
  top: 0.38,
  fx: 0.45,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function stemById(
  stems: StemMetricsType[],
  layerId: string
): StemMetricsType | undefined {
  return stems.find((s) => s.layerId === layerId);
}

/**
 * Deterministic mix agent — proposes MixDef from stem metrics.
 * Grounded in riddim sub/body/top separation (#19, #47, #93) and Tone limiter
 * patterns (GitHits Tone.js Limiter — fast attack, high ratio).
 */
export function proposeMixDef(
  song: SongDefType,
  analysis: SongMixAnalysis
): MixDefType {
  const layers: LayerMixAdjustType[] = [];
  const subStem = analysis.stems.find((s) => s.mixProfile === "sub");
  const bodyStem = analysis.stems.find((s) => s.mixProfile === "body");

  for (const raw of song.layers) {
    const layer = applyMixDefaultsToLayer(raw);
    const profile = layer.mixProfile ?? "body";
    const defaults = stripConfigForProfile(profile);
    const metrics = stemById(analysis.stems, layer.id);
    const adjust: LayerMixAdjustType = { layerId: layer.id };

    let busGain = layer.busGain;
    let songGain = layer.songGain ?? defaults.songGain;
    let hpfHz = defaults.hpfHz;
    let lpfHz = defaults.lpfHz;

    if (metrics) {
      if (profile === "body") {
        if (
          subStem &&
          metrics.centroidHz < 150 &&
          metrics.rms > subStem.rms * 0.35
        ) {
          hpfHz = Math.max(hpfHz ?? 90, 105);
          adjust.rationale = "body masking sub — raise HPF";
        }
        if (bodyStem && subStem && metrics.rms > subStem.rms * 0.75) {
          busGain = clamp(busGain - 0.06, 0.25, MAX_BUS_GAIN.body);
          adjust.rationale = (adjust.rationale ?? "") + " body hot vs sub";
        }
        if (metrics.peak > 0.82) {
          songGain = clamp(songGain - 0.06, 0.35, 0.75);
          busGain = clamp(busGain - 0.04, 0.25, MAX_BUS_GAIN.body);
          adjust.rationale = (adjust.rationale ?? "") + " body peak trim";
        }
      }

      if (profile === "top") {
        if (metrics.centroidHz < 1800 && metrics.centroidHz > 0) {
          hpfHz = Math.max(hpfHz ?? 2000, 2200);
          adjust.rationale = "top band too low — raise HPF";
        }
        if (bodyStem && metrics.rms > bodyStem.rms * 0.55) {
          busGain = clamp(busGain - 0.05, 0.12, MAX_BUS_GAIN.top);
          adjust.rationale = (adjust.rationale ?? "") + " top level down";
        }
      }

      if (profile === "sub") {
        if (metrics.peak > 0.9) {
          busGain = clamp(busGain - 0.05, 0.5, MAX_BUS_GAIN.sub);
          songGain = clamp(songGain - 0.04, 0.6, 0.9);
          adjust.rationale = "sub peak trim";
        }
      }
    }

    busGain = clamp(busGain, 0, MAX_BUS_GAIN[profile]);
    songGain = clamp(songGain, 0, 1);

    if (Math.abs(busGain - layer.busGain) > 0.001) {
      adjust.busGain = busGain;
    }
    if (
      layer.songGain !== undefined &&
      Math.abs(songGain - layer.songGain) > 0.001
    ) {
      adjust.songGain = songGain;
    } else if (
      layer.songGain === undefined &&
      Math.abs(songGain - defaults.songGain) > 0.001
    ) {
      adjust.songGain = songGain;
    }

    if (hpfHz !== undefined && hpfHz !== defaults.hpfHz) {
      adjust.hpfHz = hpfHz;
    }
    if (lpfHz !== undefined && lpfHz !== defaults.lpfHz) {
      adjust.lpfHz = lpfHz;
    }

    if (
      adjust.busGain !== undefined ||
      adjust.songGain !== undefined ||
      adjust.hpfHz !== undefined ||
      adjust.lpfHz !== undefined
    ) {
      layers.push(adjust);
    }
  }

  let master: MasterMixAdjustType | undefined;
  if (analysis.masterPeak > 0.92) {
    master = {
      inputGain: 0.82,
      limiterThreshold: -2.5,
    };
  } else if (analysis.masterPeak > 0.85) {
    master = { inputGain: 0.86, limiterThreshold: -2 };
  }

  return MixDef.parse({
    songId: song.meta.id,
    schemaVersion: 1,
    layers,
    master,
    analysis: {
      measuredAt: new Date().toISOString(),
      sampleRate: analysis.sampleRate,
      stems: analysis.stems,
      masterPeak: analysis.masterPeak,
      masterRms: analysis.masterRms,
    },
    gate: song.meta.gate === "auto" ? "auto" : "human-review",
  });
}
