import {
  MixProfile,
  type MixProfileType,
  type SongLayerDefType,
} from "@/lib/schemas/song";

export { MixProfile, type MixProfileType };

export type LayerMixStripConfig = {
  hpfHz?: number;
  lpfHz?: number;
  mono?: boolean;
  busGain: number;
  songGain: number;
  /** Soft-clip saturation before EQ (#113). */
  saturate?: boolean;
};

export type SynthSendDefaults = {
  sendLevel: number;
  reverbMix: number;
  delayMix: number;
  chorusMix: number;
};

export const MIX_STRIP_DEFAULTS: Record<MixProfileType, LayerMixStripConfig> = {
  sub: { lpfHz: 120, mono: true, busGain: 0.72, songGain: 0.82 },
  body: {
    hpfHz: 90,
    lpfHz: 800,
    saturate: true,
    busGain: 0.48,
    songGain: 0.58,
  },
  top: {
    hpfHz: 2000,
    lpfHz: 12000,
    saturate: true,
    busGain: 0.28,
    songGain: 0.42,
  },
  fx: { hpfHz: 200, lpfHz: 8000, busGain: 0.35, songGain: 0.5 },
};

export const SYNTH_SEND_DEFAULTS: Record<MixProfileType, SynthSendDefaults> = {
  sub: { sendLevel: 0, reverbMix: 0, delayMix: 0, chorusMix: 0 },
  body: { sendLevel: 0.55, reverbMix: 0.14, delayMix: 0.09, chorusMix: 0.04 },
  top: { sendLevel: 0.72, reverbMix: 0.2, delayMix: 0.12, chorusMix: 0.08 },
  fx: { sendLevel: 0.85, reverbMix: 0.24, delayMix: 0.16, chorusMix: 0.1 },
};

export function inferMixProfile(layerId: string): MixProfileType {
  const id = layerId.toLowerCase();
  if (id === "sub" || id.includes("sub")) return "sub";
  if (id === "top" || id.includes("top")) return "top";
  if (id === "fx" || id.includes("fx") || id.includes("send")) return "fx";
  return "body";
}

export function resolveMixProfile(
  layerId: string,
  explicit?: MixProfileType
): MixProfileType {
  return explicit ?? inferMixProfile(layerId);
}

export function stripConfigForProfile(
  profile: MixProfileType
): LayerMixStripConfig {
  return MIX_STRIP_DEFAULTS[profile];
}

export function applyMixDefaultsToLayer(
  layer: SongLayerDefType
): SongLayerDefType {
  const profile = resolveMixProfile(layer.id, layer.mixProfile);
  const defaults = stripConfigForProfile(profile);
  return {
    ...layer,
    mixProfile: profile,
    songGain: layer.songGain ?? defaults.songGain,
    busGain: layer.busGain ?? defaults.busGain,
  };
}

export function applyMixDefaultsToLayers(
  layers: SongLayerDefType[]
): SongLayerDefType[] {
  return layers.map(applyMixDefaultsToLayer);
}
