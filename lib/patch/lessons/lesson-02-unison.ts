import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

/** Lesson 02 — detune as a pipeline effect: osc → detune → output. */
export const lesson02Unison: Lesson = Lesson.parse({
  slug: "02-unison",
  title: "Unison & Detuning",
  unlocksNodes: ["detune"],
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
        params: { voices: 3, detune: 15, spread: 0.8, gain: 1 },
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
        id: "e-det-out",
        source: "det-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
        signal: "audio",
      },
    ],
  }),
  pages: [
    {
      title: "Stacked voices",
      steps: [
        {
          id: "explain-detune",
          kind: "explain",
          target: '[data-tour-id="node-detune"]',
          diagram: "detune-pipeline",
          content:
            "Detune is an effect in the signal path — it takes oscillator audio and thickens it with slightly offset copies.",
          detail:
            "Patch flow: oscillator → detune → output. The spread diagram shows how each voice fans out in pitch and stereo space.",
        },
        {
          id: "explain-spread",
          kind: "explain",
          target: '[data-tour-id="node-detune"]',
          diagram: "unison-spread",
          content:
            "Each detuned voice is a few cents apart and panned across the stereo field — the classic widening trick in bass music.",
          detail:
            "Sweep detune to hear beating thicken, then spread to widen the stereo image. The oscillator sets pitch; detune only widens it.",
        },
        {
          id: "do-connect",
          kind: "do",
          target: '[data-tour-id="node-output"]',
          diagram: "detune-pipeline",
          content:
            "Keep the chain connected: oscillator → detune → output.",
          detail:
            "Audio flows left to right through each effect. If a cable is missing, reconnect osc to detune and detune to output.",
          requires: {
            edge: { from: "osc-1", to: "out-1" },
          },
        },
        {
          id: "reflect-unison",
          kind: "reflect",
          diagram: "lesson-complete",
          content:
            "You unlocked the detune effect. Experiment with voice count and spread in the playground.",
          detail:
            "Playground unlocked. Next up: an envelope effect in the chain to shape volume over time.",
        },
      ],
    },
  ],
});
