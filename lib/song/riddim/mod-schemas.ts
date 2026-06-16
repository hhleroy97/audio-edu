import type { PatternEventType } from "@/lib/schemas/song";

/** One CV keyframe on the section-local beat grid. */
export type ModKeyframe = {
  beat: number;
  nodeId: string;
  param: string;
  value: number | string | boolean;
  durationBeats?: number;
};

/** Named modulation layering profile for a body/top preset archetype. */
export type RiddimModProfile = {
  id: string;
  label: string;
  presetId: string;
  layerRole: "body" | "top" | "fx";
  keyframes: ModKeyframe[];
  sources: string[];
};

/**
 * Mix-aware mod profiles — conservative at section entry, swells mid-phrase.
 * Paired with phase-1 mix strips (HPF/LPF + master limiter).
 */
export const RIDDIM_MOD_PROFILES: Record<string, RiddimModProfile> = {
  "hydraulic-drop-swell": {
    id: "hydraulic-drop-swell",
    label: "Hydraulic press — bar-3 LFO swell (mix-safe)",
    presetId: "hydraulic-press-wobble",
    layerRole: "body",
    sources: ["#2", "#63", "#64", "#100"],
    keyframes: [
      { beat: 0, nodeId: "lfo-1", param: "depth", value: 300 },
      { beat: 8, nodeId: "lfo-1", param: "depth", value: 380 },
      { beat: 12, nodeId: "filt-1", param: "resonance", value: 8.5 },
      { beat: 14, nodeId: "dist-1", param: "drive", value: 6.2 },
    ],
  },
  "subfiltronik-static-loop": {
    id: "subfiltronik-static-loop",
    label: "Subfiltronik — minimal FM micro-variation",
    presetId: "subfiltronik-loop",
    layerRole: "body",
    sources: ["#64", "#11"],
    keyframes: [
      { beat: 0, nodeId: "lfo-1", param: "depth", value: 220 },
      { beat: 8, nodeId: "fm-1", param: "index", value: 300 },
      { beat: 12, nodeId: "lfo-1", param: "depth", value: 250 },
    ],
  },
  "dual-lfo-fm-drop": {
    id: "dual-lfo-fm-drop",
    label: "Dual LFO FM — mid-phrase index throw",
    presetId: "harsh-square-fm",
    layerRole: "body",
    sources: ["#64", "#58", "#101"],
    keyframes: [
      { beat: 0, nodeId: "lfo-cut", param: "depth", value: 280 },
      { beat: 0, nodeId: "lfo-idx", param: "depth", value: 180 },
      { beat: 6, nodeId: "fm-1", param: "index", value: 480 },
      { beat: 10, nodeId: "lfo-idx", param: "depth", value: 260 },
      { beat: 14, nodeId: "dist-1", param: "drive", value: 6 },
    ],
  },
  "infekt-constant-motion": {
    id: "infekt-constant-motion",
    label: "Infekt motion — gentle phaser swell",
    presetId: "infekt-constant-motion",
    layerRole: "body",
    sources: ["#35", "#68", "#94"],
    keyframes: [
      { beat: 0, nodeId: "mfx-1", param: "depth", value: 0.5 },
      { beat: 6, nodeId: "mfx-1", param: "depth", value: 0.68 },
      { beat: 10, nodeId: "lfo-cut", param: "depth", value: 320 },
      { beat: 14, nodeId: "fm-1", param: "index", value: 360 },
    ],
  },
  "tearout-index-spike": {
    id: "tearout-index-spike",
    label: "Tearout — late-phrase FM spike",
    presetId: "tearout-screech-sustain",
    layerRole: "body",
    sources: ["#73", "#75"],
    keyframes: [
      { beat: 0, nodeId: "fm-1", param: "index", value: 580 },
      { beat: 8, nodeId: "mfx-1", param: "feedback", value: 0.62 },
      { beat: 12, nodeId: "fm-1", param: "index", value: 620 },
      { beat: 14, nodeId: "dist-1", param: "drive", value: 7.2 },
    ],
  },
  "macro-comb-top-stab": {
    id: "macro-comb-top-stab",
    label: "Top comb — sparse offbeat fizz",
    presetId: "pro-metallic-comb",
    layerRole: "top",
    sources: ["#72", "#73"],
    keyframes: [
      { beat: 2, nodeId: "mfx-1", param: "depth", value: 0.42 },
      { beat: 6, nodeId: "mfx-1", param: "depth", value: 0.58 },
      { beat: 10, nodeId: "fm-1", param: "index", value: 320 },
    ],
  },
  "drop-b-preset-swap-throw": {
    id: "drop-b-preset-swap-throw",
    label: "Drop B — gradual FM ramp after swap",
    presetId: "harsh-square-fm",
    layerRole: "body",
    sources: ["#64", "#91"],
    keyframes: [
      { beat: 0, nodeId: "fm-1", param: "index", value: 460 },
      { beat: 0, nodeId: "lfo-cut", param: "depth", value: 300 },
      { beat: 4, nodeId: "lfo-idx", param: "depth", value: 220 },
      { beat: 8, nodeId: "fm-1", param: "index", value: 500 },
      { beat: 12, nodeId: "lfo-cut", param: "depth", value: 340 },
    ],
  },
  "yoi-formant-wobble": {
    id: "yoi-formant-wobble",
    label: "Yoi talk — dual formant vowel wobble",
    presetId: "yoi-talk-wobble",
    layerRole: "body",
    sources: ["#1", "#2", "#69"],
    keyframes: [
      { beat: 0, nodeId: "lfo-1", param: "depth", value: 340 },
      { beat: 4, nodeId: "fmt-1", param: "vowel", value: "O" },
      { beat: 8, nodeId: "lfo-1", param: "depth", value: 420 },
      { beat: 12, nodeId: "fmt-1", param: "vowel", value: "U" },
    ],
  },
  "dsf-allpass-comb-swell": {
    id: "dsf-allpass-comb-swell",
    label: "DSF allpass → comb — build metallic swell",
    presetId: "dsf-allpass-comb",
    layerRole: "body",
    sources: ["#59", "#71", "#64"],
    keyframes: [
      { beat: 0, nodeId: "mfx-1", param: "depth", value: 0.38 },
      { beat: 4, nodeId: "lfo-1", param: "depth", value: 260 },
      { beat: 6, nodeId: "mfx-1", param: "depth", value: 0.52 },
      { beat: 7, nodeId: "fm-1", param: "index", value: 320 },
    ],
  },
};

export function getModProfile(id: string): RiddimModProfile | undefined {
  return RIDDIM_MOD_PROFILES[id];
}

export function listModProfiles(): RiddimModProfile[] {
  return Object.values(RIDDIM_MOD_PROFILES);
}

export function expandModProfile(
  profileId: string,
  layerId: string,
  localBeatOffset = 0
): PatternEventType[] {
  const profile = getModProfile(profileId);
  if (!profile) return [];

  return profile.keyframes.map((kf) => ({
    kind: "automation" as const,
    beat: localBeatOffset + kf.beat,
    layer: layerId,
    nodeId: kf.nodeId,
    param: kf.param,
    value: kf.value,
    durationBeats: kf.durationBeats,
  }));
}
