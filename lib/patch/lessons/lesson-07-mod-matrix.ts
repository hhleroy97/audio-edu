import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

/** Lesson 07 — CV mod matrix, bipolar depth, macro fan-out. */
export const lesson07ModMatrix: Lesson = Lesson.parse({
  slug: "07-mod-matrix",
  title: "Mod Matrix Mastery",
  unlocksNodes: ["lfo", "filter", "fm", "macro"],
  startingPatch: layoutLessonPatch({
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.55 },
      },
      {
        id: "filt-1",
        type: "filter",
        params: { cutoff: 480, resonance: 5 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { sync: "1/4", depth: 320, shape: "sine" },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
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
  }),
  pages: [
    {
      title: "CV vs audio",
      steps: [
        {
          id: "explain-cv-audio",
          kind: "explain",
          target: '[data-tour-id="node-lfo"]',
          diagram: "envelope-pipeline",
          content:
            "Audio cables carry sound. CV cables carry control voltages that move knobs without passing audio.",
          detail:
            "Red CV ports modulate parameters: LFO → filter cutoff is the classic riddim wobble. Use the mod matrix to set signed depth and offset like Serum.",
        },
        {
          id: "do-bipolar-depth",
          kind: "do",
          target: '[data-tour-id="mod-matrix"]',
          content: "Open the mod matrix and drag depth negative — hear the wobble invert.",
          detail:
            "Bipolar depth lets the LFO push cutoff above and below its base value. Unipolar mode rectifies to 0…1 for legacy behavior.",
        },
      ],
    },
    {
      title: "Dual LFO density",
      steps: [
        {
          id: "demo-dual-lfo",
          kind: "demo",
          content:
            "Load the pro-dual-lfo-growl preset from the preset menu after Run.",
          detail:
            "One LFO on cutoff at 1/4, a second on FM index at half rate — non-repeating growl motion at riddim tempo.",
        },
        {
          id: "reflect-scope",
          kind: "reflect",
          target: '[data-tour-id="scope-panel"]',
          content: "Watch the live cutoff readout and spectral centroid move with modulation.",
        },
      ],
    },
    {
      title: "Macro performance",
      steps: [
        {
          id: "unlock-macro",
          kind: "explain",
          target: '[data-tour-id="module-palette"]',
          content: "Add a Macro node and patch its CV to cutoff and FM index with different depths.",
          detail:
            "One macro knob can fan out to many targets via separate CV cables — performance control without redrawing the whole patch.",
        },
        {
          id: "complete-mod-matrix",
          kind: "reflect",
          diagram: "lesson-complete",
          content: "You can now build producer-grade modulation in Patch Lab.",
        },
      ],
    },
  ],
});
