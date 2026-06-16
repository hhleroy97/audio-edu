/**
 * RIDDIM archetype presets — organized by sound-design family.
 * Grounded in docs/research/riddim-sound-catalog.md and sources.md #63+.
 */
import { PatchPreset } from "@/lib/schemas/patch";
import type { LessonChainDef } from "@/lib/patch/lesson-chain";

function preset(
  def: Omit<PatchPreset, "patch"> & { patch: LessonChainDef }
): PatchPreset {
  return PatchPreset.parse({ ...def, patch: def.patch });
}

/** §1 — Halftime groove engines (Subfiltronik / BadKlaat pocket) */
export const hydraulicPressWobblePreset = preset({
  id: "hydraulic-press-wobble",
  title: "Hydraulic Press Wobble",
  description:
    "Slow 1/4 saw wobble with hard clip — DSF “hydraulic press” riddim feel (80–400 Hz body).",
  techniqueTags: ["technique:wobble-lfo-cutoff", "technique:multiband-distortion"],
  requiredNodes: ["oscillator", "lfo", "filter", "distortion", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 420, shape: "triangle" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 320, resonance: 8 },
      },
      {
        id: "dist-1",
        type: "distortion",
        params: { type: "hard", drive: 7, mix: 0.95, gain: 0.6 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.58 } },
    ],
    edges: [
      { id: "e1", source: "osc-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e2", source: "lfo-1", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e3", source: "filt-1", sourceHandle: "audio-out", target: "dist-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "dist-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const subfiltronikLoopPreset = preset({
  id: "subfiltronik-loop",
  title: "Subfiltronik Loop",
  description:
    "Minimal FM wobble at 1/4 with almost static motion — classic repetitive riddim phrase.",
  techniqueTags: ["technique:fm-growl", "technique:wobble-lfo-cutoff", "technique:halftime-groove"],
  requiredNodes: ["fm", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: { frequency: 110, ratio: 1, index: 320, gain: 0.45 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 260, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 480, resonance: 5 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.62 } },
    ],
    edges: [
      { id: "e1", source: "lfo-1", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e2", source: "fm-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e3", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const tripletOffgridWobblePreset = preset({
  id: "triplet-offgrid-wobble",
  title: "Triplet Off-Grid Wobble",
  description: "1/8T LFO on cutoff — Preset Drive off-kilter riddim groove.",
  techniqueTags: ["technique:wobble-lfo-cutoff"],
  requiredNodes: ["oscillator", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      { id: "osc-1", type: "oscillator", params: { waveform: "square", frequency: 110, gain: 0.48 } },
      { id: "lfo-1", type: "lfo", params: { sync: "1/8t", depth: 380, shape: "sine" } },
      { id: "filt-1", type: "filter", params: { cutoff: 400, resonance: 7 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      { id: "e1", source: "lfo-1", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e2", source: "osc-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e3", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

/** §2 — FM aggression (Virtual Riot / Barely Alive / tearout-adjacent) */
export const harshSquareFmPreset = preset({
  id: "harsh-square-fm",
  title: "Harsh Square FM",
  description:
    "DSF recipe: square + FM from B, LFO on cutoff and index — BadKlaat-adjacent grit.",
  techniqueTags: ["technique:fm-growl", "technique:wobble-lfo-cutoff"],
  requiredNodes: ["fm", "lfo", "filter", "distortion", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: { carrierWave: "square", modWave: "sawtooth", frequency: 110, ratio: 1, index: 480, gain: 0.5 },
      },
      { id: "lfo-cut", type: "lfo", params: { sync: "1/4", depth: 340, shape: "sine" } },
      { id: "lfo-idx", type: "lfo", params: { sync: "1/4", depth: 220, shape: "square", rateRatio: "half" } },
      { id: "filt-1", type: "filter", params: { cutoff: 520, resonance: 6 } },
      { id: "dist-1", type: "distortion", params: { type: "hard", drive: 6, mix: 0.88, gain: 0.62 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.55 } },
    ],
    edges: [
      { id: "e1", source: "lfo-cut", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e2", source: "lfo-idx", sourceHandle: "cv-out", target: "fm-1", targetHandle: "cv-index", signal: "cv" },
      { id: "e3", source: "fm-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "filt-1", sourceHandle: "audio-out", target: "dist-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "dist-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e6", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const pitchScreechPluckPreset = preset({
  id: "pitch-screech-pluck",
  title: "Pitch Screech Pluck",
  description:
    "Fast pitch envelope + high FM index — neuro/tearout screech pluck (HP body, no sub mud).",
  techniqueTags: ["technique:pitch-envelope", "technique:fm-growl"],
  requiredNodes: ["fm", "envelope", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: { frequency: 110, ratio: 2, index: 620, gain: 0.42 },
      },
      {
        id: "env-1",
        type: "envelope",
        params: { attack: 0.005, decay: 0.08, sustain: 0.2, release: 0.15, gain: 1, cvDepth: 900, cvSign: 1 },
      },
      { id: "filt-1", type: "filter", params: { cutoff: 1200, resonance: 8 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.52 } },
    ],
    edges: [
      { id: "e1", source: "env-1", sourceHandle: "cv-out", target: "fm-1", targetHandle: "cv-freq", signal: "cv" },
      { id: "e2", source: "fm-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e3", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const infektMotionPreset = preset({
  id: "infekt-constant-motion",
  title: "Infekt Constant Motion",
  description:
    "Phaser + dual LFO (cutoff + FM) — Infekt “never static” movement on body layer.",
  techniqueTags: ["technique:mod-fx-phaser", "technique:dual-lfo-chain", "technique:fm-growl"],
  requiredNodes: ["fm", "lfo", "modFx", "filter", "output", "analyser"],
  patch: {
    nodes: [
      { id: "fm-1", type: "fm", params: { frequency: 110, ratio: 1, index: 400, gain: 0.48 } },
      { id: "lfo-cut", type: "lfo", params: { sync: "1/4", depth: 300, shape: "sine" } },
      { id: "lfo-idx", type: "lfo", params: { sync: "1/8", depth: 200, shape: "triangle", rateRatio: "half" } },
      { id: "mfx-1", type: "modFx", params: { type: "phaser", rate: 0.35, depth: 0.75, mix: 0.55, gain: 0.8 } },
      { id: "filt-1", type: "filter", params: { cutoff: 550, resonance: 5 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.58 } },
    ],
    edges: [
      { id: "e1", source: "lfo-cut", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e2", source: "lfo-idx", sourceHandle: "cv-out", target: "fm-1", targetHandle: "cv-index", signal: "cv" },
      { id: "e3", source: "fm-1", sourceHandle: "audio-out", target: "mfx-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "mfx-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e6", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

/** §3 — Vocal / formant family */
export const yoiTalkWobblePreset = preset({
  id: "yoi-talk-wobble",
  title: "Yoi Talk Wobble",
  description: "Formant vowel sweep + 1/4 wobble — Preset Drive yoi / French LP recipe.",
  techniqueTags: ["technique:formant-filter", "technique:wobble-lfo-cutoff"],
  requiredNodes: ["oscillator", "formant", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      { id: "osc-1", type: "oscillator", params: { waveform: "sawtooth", frequency: 110, gain: 0.45 } },
      { id: "fmt-1", type: "formant", params: { vowel: "o", formantShift: 0.6, q: 11, gain: 0.65 } },
      { id: "lfo-vwl", type: "lfo", params: { sync: "1/4", depth: 180, shape: "sine" } },
      { id: "lfo-cut", type: "lfo", params: { sync: "1/4", depth: 280, shape: "triangle", rateRatio: "half" } },
      { id: "filt-1", type: "filter", params: { cutoff: 700, resonance: 4 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      { id: "e1", source: "osc-1", sourceHandle: "audio-out", target: "fmt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e2", source: "lfo-vwl", sourceHandle: "cv-out", target: "fmt-1", targetHandle: "cv-formant", signal: "cv" },
      { id: "e3", source: "lfo-cut", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e4", source: "fmt-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e6", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

/** §4 — Metallic / comb / DSF community chain */
export const dsfAllpassCombPreset = preset({
  id: "dsf-allpass-comb",
  title: "DSF Allpass-Comb",
  description:
    "FM → phaser (allpass proxy) → comb — DSF forum Cymatics+allpass+comb chain.",
  techniqueTags: ["technique:comb-metallic", "technique:mod-fx-phaser", "technique:fm-growl"],
  requiredNodes: ["fm", "modFx", "lfo", "output", "analyser"],
  patch: {
    nodes: [
      { id: "fm-1", type: "fm", params: { frequency: 110, ratio: 1, index: 450, gain: 0.5 } },
      { id: "mfx-ph", type: "modFx", params: { type: "phaser", rate: 0.08, depth: 0.35, mix: 0.5, feedback: 0.4, gain: 0.78 } },
      { id: "mfx-cb", type: "modFx", params: { type: "comb", rate: 0.22, depth: 0.8, mix: 0.65, feedback: 0.55, gain: 0.75 } },
      { id: "lfo-1", type: "lfo", params: { rate: 0.5, depth: 120, shape: "sine" } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.55 } },
    ],
    edges: [
      { id: "e1", source: "lfo-1", sourceHandle: "cv-out", target: "fm-1", targetHandle: "cv-index", signal: "cv" },
      { id: "e2", source: "fm-1", sourceHandle: "audio-out", target: "mfx-ph", targetHandle: "audio-in", signal: "audio" },
      { id: "e3", source: "mfx-ph", sourceHandle: "audio-out", target: "mfx-cb", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "mfx-cb", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const vrCombMacroThrowPreset = preset({
  id: "vr-comb-macro-throw",
  title: "VR Comb Macro Throw",
  description:
    "Macro sweeps FM index while comb modFx adds VR-style metallic throws (PresetShare complex riddim).",
  techniqueTags: ["technique:comb-metallic", "component:macro", "technique:fm-growl"],
  requiredNodes: ["fm", "macro", "modFx", "filter", "output", "analyser"],
  patch: {
    nodes: [
      { id: "fm-1", type: "fm", params: { frequency: 110, ratio: 1.5, index: 380, gain: 0.48 } },
      { id: "macro-1", type: "macro", params: { value: 0.45 } },
      { id: "mfx-1", type: "modFx", params: { type: "comb", rate: 0.3, depth: 0.85, mix: 0.6, feedback: 0.5, gain: 0.8 } },
      { id: "filt-1", type: "filter", params: { cutoff: 800, resonance: 5 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.56 } },
    ],
    edges: [
      { id: "e1", source: "macro-1", sourceHandle: "cv-out", target: "fm-1", targetHandle: "cv-index", signal: "cv" },
      { id: "e2", source: "macro-1", sourceHandle: "cv-out", target: "mfx-1", targetHandle: "cv-depth", signal: "cv" },
      { id: "e3", source: "fm-1", sourceHandle: "audio-out", target: "mfx-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "mfx-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e6", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

/** §5 — Layer / reese / stack */
export const reeseRiddimBodyPreset = preset({
  id: "reese-riddim-body",
  title: "Reese Riddim Body",
  description:
    "Detuned saw reese + synced filter wobble — Transmission Samples reese + riddim pocket.",
  techniqueTags: ["technique:saw-body", "technique:wobble-lfo-cutoff"],
  requiredNodes: ["oscillator", "detune", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      { id: "osc-1", type: "oscillator", params: { waveform: "sawtooth", frequency: 110, gain: 0.5 } },
      { id: "det-1", type: "detune", params: { voices: 4, detune: 18, spread: 0.7, gain: 0.9 } },
      { id: "lfo-1", type: "lfo", params: { sync: "1/4", depth: 350, shape: "sine", keyTrack: true } },
      { id: "filt-1", type: "filter", params: { cutoff: 450, resonance: 6 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.58 } },
    ],
    edges: [
      { id: "e1", source: "osc-1", sourceHandle: "audio-out", target: "det-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e2", source: "lfo-1", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e3", source: "det-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const fullStackGnarlPreset = preset({
  id: "full-stack-gnarl",
  title: "Full Stack Gnarl",
  description: "Three-band layerStack + FM body wobble — sub protected, top fizz intact.",
  techniqueTags: ["technique:layer-stack-three", "technique:fm-growl", "technique:noise-layer"],
  requiredNodes: ["layerStack", "fm", "lfo", "noise", "output", "analyser"],
  patch: {
    nodes: [
      { id: "fm-1", type: "fm", params: { frequency: 110, ratio: 1, index: 360, gain: 0.4 } },
      { id: "noz-1", type: "noise", params: { noiseType: "white", cutoff: 4000, resonance: 3, gain: 0.25 } },
      {
        id: "lay-1",
        type: "layerStack",
        params: {
          subGain: 0.8,
          bodyGain: 0.55,
          topGain: 0.35,
          subLpf: 180,
          bodyHpf: 90,
          bodyLpf: 5500,
          topHpf: 2200,
          gain: 0.78,
        },
      },
      { id: "lfo-1", type: "lfo", params: { sync: "1/4", depth: 300, shape: "sampleHold", holdSteps: 6 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      { id: "e-sub", source: "fm-1", sourceHandle: "audio-out", target: "lay-1", targetHandle: "audio-in-sub", signal: "audio" },
      { id: "e-body", source: "fm-1", sourceHandle: "audio-out", target: "lay-1", targetHandle: "audio-in-body", signal: "audio" },
      { id: "e-top", source: "noz-1", sourceHandle: "audio-out", target: "lay-1", targetHandle: "audio-in-top", signal: "audio" },
      { id: "e-lfo", source: "lfo-1", sourceHandle: "cv-out", target: "fm-1", targetHandle: "cv-index", signal: "cv" },
      { id: "e-out", source: "lay-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e-ana", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

/** §6 — Tearout / screech hybrids */
export const tearoutScreechSustainPreset = preset({
  id: "tearout-screech-sustain",
  title: "Tearout Screech Sustain",
  description:
    "High FM index + comb + stacked hard clip — hyper screech sustain (key-gated).",
  techniqueTags: ["technique:comb-metallic", "technique:fm-growl"],
  requiredNodes: ["fm", "modFx", "distortion", "filter", "output", "analyser"],
  patch: {
    nodes: [
      { id: "fm-1", type: "fm", params: { frequency: 110, ratio: 2, index: 680, gain: 0.42 } },
      { id: "mfx-1", type: "modFx", params: { type: "comb", rate: 0.4, depth: 0.9, mix: 0.7, feedback: 0.6, gain: 0.72 } },
      { id: "dist-1", type: "distortion", params: { type: "hard", drive: 8, mix: 0.98, gain: 0.5 } },
      { id: "filt-1", type: "filter", params: { cutoff: 1400, resonance: 7 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.5 } },
    ],
    edges: [
      { id: "e1", source: "fm-1", sourceHandle: "audio-out", target: "mfx-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e2", source: "mfx-1", sourceHandle: "audio-out", target: "dist-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e3", source: "dist-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "filt-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

export const wtMorphRiddimPreset = preset({
  id: "wt-morph-riddim",
  title: "WT Morph Riddim",
  description: "Wavetable position LFO @ 1/4 — Preset Drive timbre-shift riddim movement.",
  techniqueTags: ["technique:wavetable-morph", "technique:wobble-lfo-cutoff"],
  requiredNodes: ["wavetable", "lfo", "filter", "distortion", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "wt-1",
        type: "wavetable",
        params: { waveformA: "sine", waveformB: "sawtooth", frequency: 110, position: 0.35, gain: 0.52 },
      },
      { id: "lfo-pos", type: "lfo", params: { sync: "1/4", depth: 0.35, shape: "triangle" } },
      { id: "lfo-cut", type: "lfo", params: { sync: "1/8", depth: 280, shape: "sine", rateRatio: "half" } },
      { id: "filt-1", type: "filter", params: { cutoff: 500, resonance: 5.5 } },
      { id: "dist-1", type: "distortion", params: { type: "soft", drive: 4, mix: 0.75, gain: 0.65 } },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.58 } },
    ],
    edges: [
      { id: "e1", source: "lfo-pos", sourceHandle: "cv-out", target: "wt-1", targetHandle: "cv-pos", signal: "cv" },
      { id: "e2", source: "lfo-cut", sourceHandle: "cv-out", target: "filt-1", targetHandle: "cv-cutoff", signal: "cv" },
      { id: "e3", source: "wt-1", sourceHandle: "audio-out", target: "filt-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e4", source: "filt-1", sourceHandle: "audio-out", target: "dist-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e5", source: "dist-1", sourceHandle: "audio-out", target: "ana-1", targetHandle: "audio-in", signal: "audio" },
      { id: "e6", source: "ana-1", sourceHandle: "audio-out", target: "out-1", targetHandle: "audio-in", signal: "audio" },
    ],
  },
});

/** Presets grouped for UI / docs cross-reference */
export const RIDDIM_ARCHETYPE_SECTIONS = [
  {
    id: "groove-core",
    title: "Groove Core",
    description: "Halftime wobble engines — repetitive 1/4 pocket.",
    presetIds: ["hydraulic-press-wobble", "subfiltronik-loop", "triplet-offgrid-wobble"],
  },
  {
    id: "fm-aggression",
    title: "FM Aggression",
    description: "Growl, screech, and constant-motion FM stacks.",
    presetIds: ["harsh-square-fm", "pitch-screech-pluck", "infekt-constant-motion"],
  },
  {
    id: "vocal-formant",
    title: "Vocal / Formant",
    description: "Yoi, talk-bass, vowel motion.",
    presetIds: ["yoi-talk-wobble"],
  },
  {
    id: "metallic-modfx",
    title: "Metallic Mod FX",
    description: "Comb, phaser, DSF allpass chains.",
    presetIds: ["dsf-allpass-comb", "vr-comb-macro-throw"],
  },
  {
    id: "layer-stack",
    title: "Layer Stack",
    description: "Reese bodies and three-band gnarl.",
    presetIds: ["reese-riddim-body", "full-stack-gnarl"],
  },
  {
    id: "tearout-hybrid",
    title: "Tearout Hybrid",
    description: "Screech sustain and WT morph extremes.",
    presetIds: ["tearout-screech-sustain", "wt-morph-riddim"],
  },
] as const;

export const RIDDIM_ARCHETYPE_PRESETS = [
  hydraulicPressWobblePreset,
  subfiltronikLoopPreset,
  tripletOffgridWobblePreset,
  harshSquareFmPreset,
  pitchScreechPluckPreset,
  infektMotionPreset,
  yoiTalkWobblePreset,
  dsfAllpassCombPreset,
  vrCombMacroThrowPreset,
  reeseRiddimBodyPreset,
  fullStackGnarlPreset,
  tearoutScreechSustainPreset,
  wtMorphRiddimPreset,
] as const;
