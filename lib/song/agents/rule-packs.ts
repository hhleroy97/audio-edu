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

const DEFAULT_RHYTHM_PHRASE = {
  phraseLengthBars: 4 as const,
  templates: {
    drop: ["a", "b", "c", "d"],
  },
};

const DEFAULT_EVAL = {
  minDropNotes: 4,
  minDrumHits: 24,
  minDropSections: 1,
  minBounceKicks: 8,
  minVelocityStdDev: 0.03,
  minModKeyframesPerDrop: 4,
  minUniqueBodyPresets: 2,
  minSectionPresetSwaps: 6,
  minUniqueChordRoots: 2,
  minBarChordChanges: 2,
  minDistinctBodyMidis: 3,
  minMicroTimingSpreadMs: 1,
  minPhraseVariationBars: 4,
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
  rhythmPhrase: DEFAULT_RHYTHM_PHRASE,
  harmony: {
    progression: ["i", "VI", "III", "VII"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  melody: {
    enableChops: true,
    chopEveryBars: 2,
    octaveJumpProbability: 0.18,
    microTimingMs: 12,
    hocketAlternate: true,
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
  rhythmPhrase: DEFAULT_RHYTHM_PHRASE,
  harmony: {
    progression: ["i", "VI", "III", "VII"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  melody: {
    enableChops: true,
    chopEveryBars: 2,
    octaveJumpProbability: 0.2,
    microTimingMs: 14,
    hocketAlternate: true,
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

/** Yoi / formant wobble archetype — vocal dual-LFO body (#110). */
export const RIDDIM_YOI_16: ArrangementRulePackType = {
  id: "riddim-yoi-16",
  title: "Riddim Yoi 16",
  bars: 16,
  bpm: 140,
  key: "F#",
  scale: "minor pentatonic",
  beatsPerBar: 4,
  layers: DEFAULT_RIDDIM_LAYERS,
  drumMuteSectionIds: ["intro", "break", "outro"],
  gate: "human-review",
  rhythm: DEFAULT_RHYTHM,
  rhythmPhrase: DEFAULT_RHYTHM_PHRASE,
  harmony: {
    progression: ["i", "VI", "III", "VII"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  melody: {
    enableChops: true,
    chopEveryBars: 2,
    octaveJumpProbability: 0.2,
    microTimingMs: 10,
    hocketAlternate: true,
  },
  groove: {
    ghostSnare: { enabled: true, velocity: 0.26, beatInBar: 3 },
    hatEuclidean: { pulses: 5, steps: 16 },
    enableCatPhrases: true,
  },
  transition: {
    preDropBodyDipBeats: 2,
    preDropBodyGain: 0.1,
    buildFilterSweep: {
      nodeId: "filt-1",
      param: "frequency",
      startHz: 900,
      endHz: 240,
    },
  },
  timbre: {
    defaultTopPresetId: "pro-metallic-comb",
    bySectionKind: {
      intro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
      build: { sub: "clean-sub", body: "dsf-allpass-comb", top: "pro-metallic-comb" },
      drop: { sub: "clean-sub", body: "yoi-talk-wobble", top: "pro-metallic-comb" },
      break: { sub: "clean-sub", body: null, top: null },
      outro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
    },
  },
  modCatalog: {
    rotateWithSeed: true,
    bodyBySectionKind: {
      build: ["dsf-allpass-comb-swell"],
      drop: ["yoi-formant-wobble"],
    },
    topBySectionKind: {
      build: ["macro-comb-top-stab"],
      drop: ["macro-comb-top-stab"],
    },
  },
  modFx: {
    defaultDrumSendReverb: 0.2,
    bySectionKind: {
      drop: { drumSendReverb: 0.26, drumSendDelay: 0.12 },
    },
  },
  evaluation: DEFAULT_EVAL,
  sections: [
    { id: "intro", label: "Intro", kind: "intro", startBar: 0, endBar: 2 },
    {
      id: "build",
      label: "Build",
      kind: "build",
      startBar: 2,
      endBar: 4,
      includeTop: true,
    },
    {
      id: "drop-a",
      label: "Drop A",
      kind: "drop",
      startBar: 4,
      endBar: 8,
      includeTop: true,
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

/** Tearout screech + FM spike archetype (#110). */
export const RIDDIM_TEAROUT_16: ArrangementRulePackType = {
  id: "riddim-tearout-16",
  title: "Riddim Tearout 16",
  bars: 16,
  bpm: 140,
  key: "F#",
  scale: "minor pentatonic",
  beatsPerBar: 4,
  layers: DEFAULT_RIDDIM_LAYERS,
  drumMuteSectionIds: ["intro", "break", "outro"],
  gate: "human-review",
  rhythm: { ...DEFAULT_RHYTHM, barBVariant: "hat-roll" as const },
  rhythmPhrase: DEFAULT_RHYTHM_PHRASE,
  harmony: {
    progression: ["i", "iv", "VI", "V"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  melody: {
    enableChops: true,
    chopEveryBars: 2,
    octaveJumpProbability: 0.22,
    microTimingMs: 14,
    hocketAlternate: false,
  },
  groove: {
    ghostSnare: { enabled: true, velocity: 0.32, beatInBar: 3 },
    hatEuclidean: { pulses: 6, steps: 16 },
    enableCatPhrases: true,
  },
  transition: {
    preDropBodyDipBeats: 2,
    preDropBodyGain: 0.08,
  },
  timbre: {
    defaultTopPresetId: "pro-metallic-comb",
    dropBBodySwap: "harsh-square-fm",
    bySectionKind: {
      intro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
      build: { sub: "clean-sub", body: "reese-riddim-body", top: "pro-metallic-comb" },
      drop: { sub: "clean-sub", body: "tearout-screech-sustain", top: "pro-metallic-comb" },
      break: { sub: "clean-sub", body: null, top: null },
      outro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
    },
  },
  modCatalog: {
    rotateWithSeed: true,
    bodyBySectionKind: {
      drop: ["tearout-index-spike", "dual-lfo-fm-drop"],
    },
  },
  modFx: {
    defaultDrumSendReverb: 0.24,
    bySectionKind: {
      drop: { drumSendReverb: 0.32, drumSendDelay: 0.18 },
    },
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
      modProfileId: "tearout-index-spike",
      includeTop: true,
    },
    { id: "break", label: "Break", kind: "break", startBar: 8, endBar: 12 },
    {
      id: "drop-b",
      label: "Drop B",
      kind: "drop",
      startBar: 12,
      endBar: 16,
      bodyPresetId: "harsh-square-fm",
      modProfileId: "dual-lfo-fm-drop",
      includeTop: true,
    },
  ],
};

/** Infekt constant-motion phaser archetype (#110). */
export const RIDDIM_INFEKT_16: ArrangementRulePackType = {
  id: "riddim-infekt-16",
  title: "Riddim Infekt 16",
  bars: 16,
  bpm: 140,
  key: "F#",
  scale: "minor pentatonic",
  beatsPerBar: 4,
  layers: DEFAULT_RIDDIM_LAYERS,
  drumMuteSectionIds: ["intro", "break", "outro"],
  gate: "human-review",
  rhythm: DEFAULT_RHYTHM,
  rhythmPhrase: DEFAULT_RHYTHM_PHRASE,
  harmony: {
    progression: ["i", "VI", "III", "VII"],
    scaleOverride: "minor",
    voicingMode: "fifth",
    barsPerChord: 1,
    subOctave: 1,
    bodyOctave: 2,
  },
  melody: {
    enableChops: true,
    chopEveryBars: 2,
    octaveJumpProbability: 0.16,
    microTimingMs: 11,
    hocketAlternate: true,
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
    bySectionKind: {
      intro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
      build: { sub: "clean-sub", body: "reese-riddim-body", top: "pro-metallic-comb" },
      drop: { sub: "clean-sub", body: "infekt-constant-motion", top: "pro-metallic-comb" },
      break: { sub: "clean-sub", body: null, top: null },
      outro: { sub: "clean-sub", body: "subfiltronik-loop", top: null },
    },
  },
  modCatalog: {
    rotateWithSeed: true,
    bodyBySectionKind: {
      drop: ["infekt-constant-motion", "dual-lfo-fm-drop"],
    },
    topBySectionKind: {
      drop: ["macro-comb-top-stab"],
    },
  },
  modFx: {
    defaultDrumSendReverb: 0.22,
    bySectionKind: {
      drop: {
        bodyModProfileId: "infekt-constant-motion",
        topModProfileId: "macro-comb-top-stab",
        drumSendReverb: 0.3,
        drumSendDelay: 0.14,
      },
    },
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
      modProfileId: "infekt-constant-motion",
      includeTop: true,
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
      includeTop: true,
    },
  ],
};

export const ARRANGEMENT_RULE_PACKS: Record<string, ArrangementRulePackType> = {
  [RIDDIM_STANDARD_16.id]: RIDDIM_STANDARD_16,
  [RIDDIM_SICK_DROP_16.id]: RIDDIM_SICK_DROP_16,
  [RIDDIM_YOI_16.id]: RIDDIM_YOI_16,
  [RIDDIM_TEAROUT_16.id]: RIDDIM_TEAROUT_16,
  [RIDDIM_INFEKT_16.id]: RIDDIM_INFEKT_16,
};

export const ARRANGEMENT_RULE_PACK_LIST = Object.values(ARRANGEMENT_RULE_PACKS);

export function getRulePack(id: string): ArrangementRulePackType | undefined {
  return ARRANGEMENT_RULE_PACKS[id];
}

export function listRulePacks(): ArrangementRulePackType[] {
  return ARRANGEMENT_RULE_PACK_LIST;
}
