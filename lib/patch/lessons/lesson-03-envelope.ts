import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

/** Lesson 03 — amplitude envelope effect in the chain. */
export const lesson03Envelope: Lesson = Lesson.parse({
  slug: "03-envelope",
  title: "Amplitude Envelope",
  unlocksNodes: ["envelope"],
  startingPatch: layoutLessonPatch({
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 1 },
      },
      {
        id: "det-1",
        type: "detune",
        params: { voices: 3, detune: 12, spread: 0.6, gain: 1 },
      },
      {
        id: "env-1",
        type: "envelope",
        params: {
          attack: 0.01,
          decay: 0.15,
          sustain: 0.5,
          release: 0.35,
          gain: 1,
        },
      },
      {
        id: "out-1",
        type: "output",
        params: { gain: 0.8 },
      },
    ],
    edges: [
      {
        id: "e-osc-det",
        source: "osc-1",
        sourceHandle: "audio-out",
        target: "det-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-det-env",
        source: "det-1",
        sourceHandle: "audio-out",
        target: "env-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
      {
        id: "e-env-out",
        source: "env-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  }),
  pages: [
    {
      title: "Shape over time",
      steps: [
        {
          id: "explain-envelope",
          kind: "explain",
          target: '[data-tour-id="node-envelope"]',
          diagram: "envelope-pipeline",
          content:
            "The envelope is another effect in the chain — it shapes how loud the sound is over time.",
          detail:
            "Patch flow: oscillator → detune → envelope → output. Each box is a stage; audio flows left to right and gets transformed at every step.",
        },
        {
          id: "explain-adsr",
          kind: "explain",
          target: '[data-tour-id="node-envelope"]',
          diagram: "envelope-adsr",
          content:
            "ADSR: Attack rises to peak, Decay settles to Sustain, Release fades after you let go of a key.",
          detail:
            "Short attack = pluck. Long release = tail. The curve on the node previews the shape. Hold keys to hear sustain; release to hear the fade.",
        },
        {
          id: "do-connect",
          kind: "do",
          target: '[data-tour-id="node-output"]',
          diagram: "envelope-pipeline",
          content: "Keep the full chain wired: oscillator → detune → envelope → output.",
          detail:
            "Every effect needs an input and output cable. Missing links silence the patch even if Run is active.",
          requires: {
            edge: { from: "osc-1", to: "out-1" },
          },
        },
        {
          id: "demo-pluck",
          kind: "demo",
          target: '[data-tour-id="transport-run"]',
          diagram: "run-transport",
          content:
            "Press Run, then tap keys — hear the envelope shape the detuned tone into a pluck or pad.",
          detail:
            "Try shortening attack for a punchy bass hit, or lengthening release so the spectrogram shows a fading tail.",
        },
        {
          id: "reflect-envelope",
          kind: "reflect",
          diagram: "lesson-complete",
          content:
            "You built a three-stage patch. Effects stack — later lessons add filters and mixers for even richer timbres.",
          detail:
            "Playground unlocked. Reorder cables, add analyser taps, or stack another oscillator path into the mixer when it arrives.",
        },
      ],
    },
  ],
});
