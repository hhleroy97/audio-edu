import { PatchPreset } from "@/lib/schemas/patch";
import type { LessonChainDef } from "@/lib/patch/lesson-chain";

function preset(
  def: Omit<PatchPreset, "patch"> & { patch: LessonChainDef }
): PatchPreset {
  return PatchPreset.parse({
    ...def,
    patch: def.patch,
  });
}

/** Mono sine sub — felt low-end only. */
export const cleanSubPreset = preset({
  id: "clean-sub",
  title: "Clean Sub",
  description:
    "Sine oscillator at 55 Hz — riddim sub layer. Press keys after Run; no modulation.",
  techniqueTags: ["technique:sub-layer"],
  requiredNodes: ["oscillator", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-sub",
        type: "oscillator",
        params: { waveform: "sine", frequency: 55, gain: 0.9 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.75 } },
    ],
    edges: [
      {
        id: "e-osc-ana",
        source: "osc-sub",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Detuned saw body — harmonic foundation before filtering. */
export const sawBodyPreset = preset({
  id: "saw-body",
  title: "Saw Body",
  description:
    "Sawtooth at 110 Hz — riddim body source. Rich harmonics visible on the FFT.",
  techniqueTags: ["technique:saw-body"],
  requiredNodes: ["oscillator", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.55 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.7 } },
    ],
    edges: [
      {
        id: "e-osc-ana",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** LFO → filter cutoff wobble — core riddim movement. */
export const wobbleStubPreset = preset({
  id: "wobble-stub",
  title: "Wobble Stub",
  description:
    "Saw through a lowpass filter with LFO on cutoff. Classic riddim wobble architecture.",
  techniqueTags: ["technique:wobble-lfo-cutoff", "technique:saw-body"],
  requiredNodes: ["oscillator", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { rate: 2, depth: 350, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 450, resonance: 6 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
    ],
    edges: [
      {
        id: "e-osc-filt",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-lfo-cutoff",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Detuned saw stack — unison spread before filtering. */
export const detunedBodyPreset = preset({
  id: "detuned-body",
  title: "Detuned Body",
  description:
    "Saw oscillator through a detune spreader — wide riddim body before the filter stage.",
  techniqueTags: ["technique:saw-body", "technique:unison-spread"],
  requiredNodes: ["oscillator", "detune", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.45 },
      },
      {
        id: "det-1",
        type: "detune",
        params: { voices: 4, detune: 18, spread: 0.85, gain: 0.7 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
    ],
    edges: [
      {
        id: "e-osc-det",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "det-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-det-ana",
        source: "det-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Envelope CV on pitch — classic riddim bite on note onset. */
export const pitchBitePreset = preset({
  id: "pitch-bite",
  title: "Pitch Bite",
  description:
    "Fast envelope CV pulls oscillator pitch up then settles — press keys after Run.",
  techniqueTags: ["technique:pitch-envelope", "technique:saw-body"],
  requiredNodes: [
    "oscillator",
    "envelope",
    "filter",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5 },
      },
      {
        id: "env-1",
        type: "envelope",
        params: {
          attack: 0.008,
          decay: 0.18,
          sustain: 0.2,
          release: 0.2,
          gain: 1,
          cvDepth: 520,
        },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 680, resonance: 4 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      {
        id: "e-env-pitch",
        source: "env-1",
        sourceHandle: "cv-out",
        target: "osc-body",
        targetHandle: "cv-freq",
        signal: "cv",
      },
      {
        id: "e-osc-filt",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Sub + body layered through mixer — riddim low-end stack. */
export const subBodyStackPreset = preset({
  id: "sub-body-stack",
  title: "Sub + Body",
  description: "55 Hz sine sub summed with detuned saw body via the mixer bus.",
  techniqueTags: ["technique:sub-layer", "technique:saw-body", "technique:sub-body-split"],
  requiredNodes: ["oscillator", "detune", "mixer", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-sub",
        type: "oscillator",
        params: { waveform: "sine", frequency: 55, gain: 0.85 },
      },
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.4 },
      },
      {
        id: "det-1",
        type: "detune",
        params: { voices: 3, detune: 12, spread: 0.7, gain: 0.65 },
      },
      {
        id: "mix-1",
        type: "mixer",
        params: { gainA: 0.6, gainB: 0.5, gain: 0.75 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.7 } },
    ],
    edges: [
      {
        id: "e-osc-det",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "det-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-sub-mix",
        source: "osc-sub",
        sourceHandle: "audio-out",
        target: "mix-1",
        targetHandle: "audio-in-a",
        signal: "audio",
      },
      {
        id: "e-det-mix",
        source: "det-1",
        sourceHandle: "audio-out",
        target: "mix-1",
        targetHandle: "audio-in-b",
        signal: "audio",
      },
      {
        id: "e-mix-ana",
        source: "mix-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Detuned body with LFO filter wobble. */
export const unisonWobblePreset = preset({
  id: "unison-wobble",
  title: "Unison Wobble",
  description: "Detuned saw through a wobbling lowpass — full riddim movement stack.",
  techniqueTags: [
    "technique:unison-spread",
    "technique:wobble-lfo-cutoff",
    "technique:saw-body",
  ],
  requiredNodes: [
    "oscillator",
    "detune",
    "lfo",
    "filter",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.42 },
      },
      {
        id: "det-1",
        type: "detune",
        params: { voices: 5, detune: 22, spread: 0.9, gain: 0.6 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { rate: 3.5, depth: 420, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 520, resonance: 7 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.62 } },
    ],
    edges: [
      {
        id: "e-osc-det",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "det-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-det-filt",
        source: "det-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-lfo-cut",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Sine → saw wavetable morph — timbral motion without FM. */
export const wavetableMorphPreset = preset({
  id: "wavetable-morph",
  title: "WT Morph",
  description:
    "Crossfade sine to saw wavetable at 110 Hz — scrub Morph knob while playing.",
  techniqueTags: ["technique:wavetable-morph"],
  requiredNodes: ["wavetable", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "wt-1",
        type: "wavetable",
        params: {
          waveformA: "sine",
          waveformB: "sawtooth",
          frequency: 110,
          position: 0.35,
          gain: 0.55,
        },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.68 } },
    ],
    edges: [
      {
        id: "e-wt-ana",
        source: "wt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Envelope sweeps filter cutoff — pluck-style motion. */
export const envFilterSweepPreset = preset({
  id: "env-filter-sweep",
  title: "Env Filter Sweep",
  description: "Saw body with envelope CV opening the filter on each key press.",
  techniqueTags: ["technique:pitch-envelope", "technique:wobble-lfo-cutoff"],
  requiredNodes: ["oscillator", "envelope", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.48 },
      },
      {
        id: "env-1",
        type: "envelope",
        params: {
          attack: 0.01,
          decay: 0.35,
          sustain: 0.15,
          release: 0.3,
          gain: 1,
          cvDepth: 900,
        },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 280, resonance: 5 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
    ],
    edges: [
      {
        id: "e-env-cut",
        source: "env-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-osc-filt",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** FM growl with tempo-synced index wobble + distortion. */
export const fmGrowlStubPreset = preset({
  id: "fm-growl-stub",
  title: "FM Growl",
  description:
    "FM pair with LFO on index (1/4 sync) through hard clip — classic growl architecture.",
  techniqueTags: ["technique:fm-growl", "technique:wobble-lfo-cutoff"],
  requiredNodes: [
    "fm",
    "lfo",
    "distortion",
    "filter",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: {
          carrierWave: "sine",
          modWave: "sawtooth",
          frequency: 110,
          ratio: 1,
          index: 450,
          gain: 0.48,
        },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 380, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 520, resonance: 5 },
      },
      {
        id: "dist-1",
        type: "distortion",
        params: { type: "hard", drive: 6, mix: 0.92, gain: 0.65 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      {
        id: "e-lfo-index",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "fm-1",
        targetHandle: "cv-index",
        signal: "cv",
      },
      {
        id: "e-fm-filt",
        source: "fm-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-dist",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "dist-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-dist-ana",
        source: "dist-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Tempo-synced 1/4 wobble — riddim grid lock at transport BPM. */
export const syncWobblePreset = preset({
  id: "sync-wobble",
  title: "Sync Wobble",
  description:
    "Saw body with LFO on filter cutoff synced to 1/4 notes. Set transport BPM in the aside.",
  techniqueTags: ["technique:wobble-lfo-cutoff", "technique:saw-body"],
  requiredNodes: ["oscillator", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 400, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 400, resonance: 7 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
    ],
    edges: [
      {
        id: "e-lfo-cut",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-osc-filt",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Full riddim layer stack — protected sub + wobble body + distortion. */
export const riddimLayerStackPreset = preset({
  id: "riddim-layer-stack",
  title: "Riddim Stack",
  description:
    "Sub sine (no modulation) + sync-wobble body through distortion on the 3-layer bus.",
  techniqueTags: [
    "technique:sub-layer",
    "technique:sub-body-split",
    "technique:wobble-lfo-cutoff",
  ],
  requiredNodes: [
    "oscillator",
    "lfo",
    "filter",
    "distortion",
    "layerStack",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "osc-sub",
        type: "oscillator",
        params: { waveform: "sine", frequency: 55, gain: 0.9 },
      },
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.45 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/8", depth: 350, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 380, resonance: 6 },
      },
      {
        id: "dist-1",
        type: "distortion",
        params: { type: "hard", drive: 5.5, mix: 0.88, gain: 0.7 },
      },
      {
        id: "stack-1",
        type: "layerStack",
        params: {
          subGain: 0.7,
          bodyGain: 0.55,
          topGain: 0,
          subLpf: 200,
          bodyHpf: 90,
          gain: 0.78,
        },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.68 } },
    ],
    edges: [
      {
        id: "e-lfo-cut",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-osc-filt",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-dist",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "dist-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-sub-stack",
        source: "osc-sub",
        sourceHandle: "audio-out",
        target: "stack-1",
        targetHandle: "audio-in-sub",
        signal: "audio",
      },
      {
        id: "e-body-stack",
        source: "dist-1",
        sourceHandle: "audio-out",
        target: "stack-1",
        targetHandle: "audio-in-body",
        signal: "audio",
      },
      {
        id: "e-stack-ana",
        source: "stack-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Yoi vowel formants on a growl source — F2 morph via LFO. */
export const yoiFormantPreset = preset({
  id: "yoi-formant",
  title: "Yoi Formant",
  description:
    "FM growl through a 3-band formant bank with sync LFO morphing F2 (vowel yoi).",
  techniqueTags: [
    "technique:formant-filter",
    "technique:fm-growl",
    "technique:wobble-lfo-cutoff",
  ],
  requiredNodes: [
    "fm",
    "formant",
    "lfo",
    "filter",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: {
          carrierWave: "sine",
          modWave: "sawtooth",
          frequency: 95,
          ratio: 2,
          index: 520,
          gain: 0.55,
        },
      },
      {
        id: "fmt-1",
        type: "formant",
        params: { vowel: "o", formantShift: 0.5, q: 10, gain: 0.7 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 280, shape: "sine" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 900, resonance: 4 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
    ],
    edges: [
      {
        id: "e-fm-fmt",
        source: "fm-1",
        sourceHandle: "audio-out",
        target: "fmt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-lfo-fmt",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "fmt-1",
        targetHandle: "cv-formant",
        signal: "cv",
      },
      {
        id: "e-fmt-filt",
        source: "fmt-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Bandpassed noise fizz layer for top-end grit. */
export const noiseFizzPreset = preset({
  id: "noise-fizz",
  title: "Noise Fizz",
  description:
    "Pink noise oscillator through a resonant bandpass — layer with body for fizz.",
  techniqueTags: ["technique:noise-layer", "technique:bandpass-fizz"],
  requiredNodes: ["noise", "mixer", "oscillator", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.4 },
      },
      {
        id: "noise-1",
        type: "noise",
        params: {
          noiseType: "pink",
          cutoff: 4800,
          resonance: 5,
          gain: 0.28,
        },
      },
      {
        id: "mix-1",
        type: "mixer",
        params: { gainA: 0.6, gainB: 0.35, gain: 0.75 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      {
        id: "e-osc-mix",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "mix-1",
        targetHandle: "audio-in-a",
        signal: "audio",
      },
      {
        id: "e-noise-mix",
        source: "noise-1",
        sourceHandle: "audio-out",
        target: "mix-1",
        targetHandle: "audio-in-b",
        signal: "audio",
      },
      {
        id: "e-mix-ana",
        source: "mix-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Custom drawable LFO stutter wobble on filter cutoff. */
export const customLfoWobblePreset = preset({
  id: "custom-lfo-wobble",
  title: "Custom LFO Wobble",
  description:
    "Drawable LFO plateau-drop curve modulating filter cutoff on a saw body.",
  techniqueTags: [
    "technique:custom-lfo",
    "technique:wobble-lfo-cutoff",
    "technique:pitch-envelope",
  ],
  requiredNodes: [
    "oscillator",
    "envelope",
    "lfo",
    "filter",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5 },
      },
      {
        id: "env-1",
        type: "envelope",
        params: {
          attack: 0.005,
          decay: 0.08,
          sustain: 0,
          release: 0.12,
          gain: 0.85,
          cvDepth: 180,
          cvSign: -1,
        },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: {
          sync: "1/8",
          depth: 420,
          shape: "custom",
          curvePoints: "0:1,0.35:1,0.45:0.15,0.85:0.15,1:1",
        },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 320, resonance: 7 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.62 } },
    ],
    edges: [
      {
        id: "e-osc-env",
        source: "osc-1",
        sourceHandle: "audio-out",
        target: "env-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-env-pitch",
        source: "env-1",
        sourceHandle: "cv-out",
        target: "osc-1",
        targetHandle: "cv-freq",
        signal: "cv",
      },
      {
        id: "e-lfo-cut",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-env-filt",
        source: "env-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** OTT multiband polish on riddim layer stack output. */
export const ottBassPolishPreset = preset({
  id: "ott-bass-polish",
  title: "OTT Polish",
  description: "3-band OTT-style dynamics on a riddim layer stack for finished bass weight.",
  techniqueTags: ["technique:multiband-ott", "technique:sub-body-split"],
  requiredNodes: [
    "oscillator",
    "layerStack",
    "multiband",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "osc-sub",
        type: "oscillator",
        params: { waveform: "sine", frequency: 55, gain: 0.85 },
      },
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5, glideMs: 40 },
      },
      {
        id: "stack-1",
        type: "layerStack",
        params: { subGain: 0.75, bodyGain: 0.55, topGain: 0, gain: 0.8 },
      },
      {
        id: "ott-1",
        type: "multiband",
        params: { amount: 0.72, threshold: -22, lowCross: 220, gain: 0.88 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
    ],
    edges: [
      {
        id: "e-sub-stack",
        source: "osc-sub",
        sourceHandle: "audio-out",
        target: "stack-1",
        targetHandle: "audio-in-sub",
        signal: "audio",
      },
      {
        id: "e-body-stack",
        source: "osc-body",
        sourceHandle: "audio-out",
        target: "stack-1",
        targetHandle: "audio-in-body",
        signal: "audio",
      },
      {
        id: "e-stack-ott",
        source: "stack-1",
        sourceHandle: "audio-out",
        target: "ott-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ott-ana",
        source: "ott-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Metallic phaser on FM growl. */
export const metallicPhaserPreset = preset({
  id: "metallic-phaser",
  title: "Metallic Phaser",
  description: "FM growl through phaser mod FX — metallic riddim variant.",
  techniqueTags: ["technique:fm-growl", "technique:mod-fx-phaser"],
  requiredNodes: ["fm", "modFx", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: {
          frequency: 95,
          ratio: 2,
          index: 480,
          gain: 0.55,
          glideMs: 30,
        },
      },
      {
        id: "mfx-1",
        type: "modFx",
        params: { type: "phaser", rate: 0.35, depth: 0.8, mix: 0.6, gain: 0.75 },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 700, resonance: 5 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.62 } },
    ],
    edges: [
      {
        id: "e-fm-mfx",
        source: "fm-1",
        sourceHandle: "audio-out",
        target: "mfx-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-mfx-filt",
        source: "mfx-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Serial dual-filter growl sculpt. */
export const dualFilterGrowlPreset = preset({
  id: "dual-filter-growl",
  title: "Dual Filter Growl",
  description: "Saw body through serial filter bank with half-rate LFO wobble.",
  techniqueTags: [
    "technique:filter-bank",
    "technique:wobble-lfo-cutoff",
    "technique:dual-lfo-ratio",
  ],
  requiredNodes: [
    "oscillator",
    "filterBank",
    "lfo",
    "output",
    "analyser",
  ],
  patch: {
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.55, glideMs: 35 },
      },
      {
        id: "fb-1",
        type: "filterBank",
        params: {
          mode: "serial",
          f1Cutoff: 420,
          f2Cutoff: 2800,
          f1Res: 6,
          f2Res: 3,
          gain: 0.8,
        },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/8", depth: 380, shape: "sine", rateRatio: "half" },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      {
        id: "e-osc-fb",
        source: "osc-1",
        sourceHandle: "audio-out",
        target: "fb-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-lfo-f1",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "fb-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-fb-ana",
        source: "fb-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Pro dual-LFO growl — cutoff + FM index at different sync rates. */
export const proDualLfoGrowlPreset = preset({
  id: "pro-dual-lfo-growl",
  title: "Pro Dual-LFO Growl",
  description:
    "LFO1 on filter cutoff (1/4), LFO2 on FM index (1/8 half-rate) through OTT polish.",
  techniqueTags: [
    "technique:fm-growl",
    "technique:wobble-lfo-cutoff",
    "technique:dual-lfo-chain",
    "technique:ott-polish",
  ],
  requiredNodes: ["fm", "lfo", "filter", "multiband", "distortion", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: {
          carrierWave: "sine",
          modWave: "sawtooth",
          frequency: 110,
          ratio: 1,
          index: 420,
          gain: 0.5,
        },
      },
      {
        id: "lfo-cut",
        type: "lfo",
        params: { sync: "1/4", depth: 360, shape: "sine" },
      },
      {
        id: "lfo-idx",
        type: "lfo",
        params: { sync: "1/8", depth: 280, shape: "triangle", rateRatio: "half" },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 520, resonance: 6 },
      },
      {
        id: "dist-1",
        type: "distortion",
        params: { type: "hard", drive: 5.5, mix: 0.9, gain: 0.65 },
      },
      {
        id: "ott-1",
        type: "multiband",
        params: { amount: 0.6, threshold: -22, ratio: 6, gain: 0.82 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.58 } },
    ],
    edges: [
      {
        id: "e-lfo-cut",
        source: "lfo-cut",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-lfo-idx",
        source: "lfo-idx",
        sourceHandle: "cv-out",
        target: "fm-1",
        targetHandle: "cv-index",
        signal: "cv",
      },
      {
        id: "e-fm-filt",
        source: "fm-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-dist",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "dist-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-dist-ott",
        source: "dist-1",
        sourceHandle: "audio-out",
        target: "ott-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ott-ana",
        source: "ott-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Sample-hold stutter wobble with synced LFO. */
export const proStutterWobblePreset = preset({
  id: "pro-stutter-wobble",
  title: "Pro Stutter Wobble",
  description: "S&H LFO on filter cutoff at 1/4 — stepped riddim motion.",
  techniqueTags: ["technique:wobble-lfo-cutoff", "technique:sample-hold-lfo"],
  requiredNodes: ["oscillator", "lfo", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.52 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 400, shape: "sampleHold", holdSteps: 8 },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 420, resonance: 7 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.62 } },
    ],
    edges: [
      {
        id: "e-osc-filt",
        source: "osc-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-lfo-cut",
        source: "lfo-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** Macro fan-out wobble on cutoff + FM index. */
export const proMacroWobblePreset = preset({
  id: "pro-macro-wobble",
  title: "Pro Macro Wobble",
  description: "Single macro CV drives filter cutoff and FM index together.",
  techniqueTags: [
    "technique:wobble-lfo-cutoff",
    "technique:fm-growl",
    "component:macro",
  ],
  requiredNodes: ["fm", "macro", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: {
          frequency: 110,
          ratio: 1,
          index: 380,
          gain: 0.48,
        },
      },
      {
        id: "macro-1",
        type: "macro",
        params: { value: 0.55 },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 500, resonance: 5.5 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.6 } },
    ],
    edges: [
      {
        id: "e-macro-cut",
        source: "macro-1",
        sourceHandle: "cv-out",
        target: "filt-1",
        targetHandle: "cv-cutoff",
        signal: "cv",
      },
      {
        id: "e-macro-idx",
        source: "macro-1",
        sourceHandle: "cv-out",
        target: "fm-1",
        targetHandle: "cv-index",
        signal: "cv",
      },
      {
        id: "e-fm-filt",
        source: "fm-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

/** FM + comb metallic formant sweep. */
export const proMetallicCombPreset = preset({
  id: "pro-metallic-comb",
  title: "Pro Metallic Comb",
  description: "FM growl through comb modFx and formant vowel sweep.",
  techniqueTags: [
    "technique:fm-growl",
    "technique:comb-metallic",
    "technique:formant-yoi",
  ],
  requiredNodes: ["fm", "modFx", "formant", "filter", "output", "analyser"],
  patch: {
    nodes: [
      {
        id: "fm-1",
        type: "fm",
        params: { frequency: 95, ratio: 2, index: 500, gain: 0.52 },
      },
      {
        id: "mfx-1",
        type: "modFx",
        params: { type: "comb", rate: 0.25, depth: 0.85, mix: 0.65, gain: 0.78 },
      },
      {
        id: "fmt-1",
        type: "formant",
        params: { vowel: "o", formantShift: 0.45, q: 10, gain: 0.6 },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 650, resonance: 4.5 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.58 } },
    ],
    edges: [
      {
        id: "e-fm-mfx",
        source: "fm-1",
        sourceHandle: "audio-out",
        target: "mfx-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-mfx-fmt",
        source: "mfx-1",
        sourceHandle: "audio-out",
        target: "fmt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-fmt-filt",
        source: "fmt-1",
        sourceHandle: "audio-out",
        target: "filt-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-filt-ana",
        source: "filt-1",
        sourceHandle: "audio-out",
        target: "ana-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-ana-out",
        source: "ana-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  },
});

export const PATCH_PRESETS = [
  cleanSubPreset,
  sawBodyPreset,
  wobbleStubPreset,
  detunedBodyPreset,
  pitchBitePreset,
  subBodyStackPreset,
  unisonWobblePreset,
  wavetableMorphPreset,
  envFilterSweepPreset,
  fmGrowlStubPreset,
  syncWobblePreset,
  riddimLayerStackPreset,
  yoiFormantPreset,
  noiseFizzPreset,
  customLfoWobblePreset,
  ottBassPolishPreset,
  metallicPhaserPreset,
  dualFilterGrowlPreset,
  proDualLfoGrowlPreset,
  proStutterWobblePreset,
  proMacroWobblePreset,
  proMetallicCombPreset,
] as const;

export function getPatchPreset(id: string): PatchPreset | undefined {
  return PATCH_PRESETS.find((p) => p.id === id);
}
