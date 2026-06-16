import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import { DEFAULT_RIDDIM_LAYERS } from "../riddim/patterns";

const DEFAULT_RHYTHM = {
  bounceKick: { enabled: true, velocity: 0.35 },
  mainSnareBeat: 1,
  phraseBars: 2,
  barBVariant: "extra-bounce" as const,
  swingMs: 8,
  velocityJitter: 0.06,
};

const DEFAULT_EVAL = {
  minDropNotes: 4,
  minDrumHits: 24,
  minDropSections: 1,
  minBounceKicks: 8,
  minVelocityStdDev: 0.03,
  minModKeyframesPerDrop: 2,
  minUniqueBodyPresets: 1,
  minSectionPresetSwaps: 6,
  minUniqueChordRoots: 2,
  minBarChordChanges: 2,
};

/** Standard 16-bar riddim — intro / build / drop / break / outro. */
export const RIDDIM_STANDARD_16: ArrangementRulePackType = {
  id: "riddim-standard-16",
  title: "Riddim Standard 16",
  bars: 16,
  bpm: 140,
  key: "F#",
  scale: "minor pentatonic",
  beatsPerBar: 4,
  layers: DEFAULT_RIDDIM_LAYERS,
  drumMuteSectionIds: ["intro", "break", "outro"],
  gate: "human-review",
  rhythm: DEFAULT_RHYTHM,
  harmony: {
    progression: ["i", "VI", "III", "VII"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  groove: {
    ghostSnare: { enabled: true, velocity: 0.28, beatInBar: 3 },
    hatEuclidean: { pulses: 5, steps: 16 },
    enableCatPhrases: true,
  },
  transition: {
    preDropBodyDipBeats: 2,
    preDropBodyGain: 0.12,
  },
  timbre: {
    defaultTopPresetId: "pro-metallic-comb",
    dropBBodySwap: "harsh-square-fm",
  },
  modFx: {
    defaultDrumSendReverb: 0.22,
  },
  evaluation: DEFAULT_EVAL,
  sections: [
    { id: "intro", label: "Intro", kind: "intro", startBar: 0, endBar: 2 },
    { id: "build", label: "Build", kind: "build", startBar: 2, endBar: 4 },
    {
      id: "drop-a",
      label: "Drop A",
      kind: "drop",
      startBar: 4,
      endBar: 8,
      modProfileId: "hydraulic-drop-swell",
    },
    { id: "break", label: "Break", kind: "break", startBar: 8, endBar: 12 },
    {
      id: "outro",
      label: "Outro",
      kind: "outro",
      startBar: 12,
      endBar: 16,
    },
  ],
};

/** Sick drop variant — build → drop A → break → drop B with preset swap. */
export const RIDDIM_SICK_DROP_16: ArrangementRulePackType = {
  id: "riddim-sick-drop-16",
  title: "Riddim Sick Drop 16",
  bars: 16,
  bpm: 140,
  key: "F#",
  scale: "minor pentatonic",
  beatsPerBar: 4,
  layers: DEFAULT_RIDDIM_LAYERS,
  drumMuteSectionIds: ["intro", "break", "outro"],
  gate: "human-review",
  rhythm: { ...DEFAULT_RHYTHM, barBVariant: "hat-roll" as const },
  harmony: {
    progression: ["i", "VI", "III", "VII"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  groove: {
    ghostSnare: { enabled: true, velocity: 0.28, beatInBar: 3 },
    hatEuclidean: { pulses: 5, steps: 16 },
    enableCatPhrases: true,
  },
  transition: {
    preDropBodyDipBeats: 2,
    preDropBodyGain: 0.12,
    buildFilterSweep: {
      nodeId: "filt-1",
      param: "frequency",
      startHz: 800,
      endHz: 220,
    },
  },
  timbre: {
    defaultTopPresetId: "pro-metallic-comb",
    dropBBodySwap: "harsh-square-fm",
  },
  modFx: {
    defaultDrumSendReverb: 0.28,
  },
  evaluation: { ...DEFAULT_EVAL, minUniqueBodyPresets: 2 },
  sections: [
    { id: "intro", label: "Intro", kind: "intro", startBar: 0, endBar: 2 },
    { id: "build", label: "Build", kind: "build", startBar: 2, endBar: 4 },
    {
      id: "drop-a",
      label: "Drop A",
      kind: "drop",
      startBar: 4,
      endBar: 8,
      modProfileId: "hydraulic-drop-swell",
    },
    { id: "break", label: "Break", kind: "break", startBar: 8, endBar: 12 },
    {
      id: "drop-b",
      label: "Drop B",
      kind: "drop",
      startBar: 12,
      endBar: 16,
      bodyPresetId: "harsh-square-fm",
      modProfileId: "drop-b-preset-swap-throw",
    },
  ],
};

export const ARRANGEMENT_RULE_PACKS: Record<string, ArrangementRulePackType> = {
  [RIDDIM_STANDARD_16.id]: RIDDIM_STANDARD_16,
  [RIDDIM_SICK_DROP_16.id]: RIDDIM_SICK_DROP_16,
};

export const ARRANGEMENT_RULE_PACK_LIST = Object.values(ARRANGEMENT_RULE_PACKS);

export function getRulePack(id: string): ArrangementRulePackType | undefined {
  return ARRANGEMENT_RULE_PACKS[id];
}

export function listRulePacks(): ArrangementRulePackType[] {
  return ARRANGEMENT_RULE_PACK_LIST;
}
