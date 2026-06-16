import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

export const lesson01Oscillator: Lesson = Lesson.parse({
  slug: "01-oscillator",
  title: "Oscillator Basics",
  unlocksNodes: ["oscillator", "output", "analyser"],
  startingPatch: layoutLessonPatch({
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sine", frequency: 261.63, gain: 1 },
      },
      {
        id: "ana-1",
        type: "analyser",
        params: {},
      },
      {
        id: "out-1",
        type: "output",
        params: { gain: 0.8 },
      },
    ],
    edges: [
      {
        id: "e-osc-ana",
        source: "osc-1",
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
      title: "Signal path",
      steps: [
        {
          id: "explain-osc",
          kind: "explain",
          target: '[data-tour-id="node-oscillator"]',
          diagram: "oscillator-intro",
          content:
            "An oscillator generates periodic waveforms. This is where sound begins in subtractive synthesis.",
          detail:
            "Use your keyboard to play notes: middle row (A–K) is white keys, top row (W E T Y U) is black keys. Z and X shift octave down/up. The level fader appears as you progress — it sets volume while keys are held.",
        },
        {
          id: "explain-cable",
          kind: "explain",
          target: '[data-tour-id="port-audio-out"]',
          diagram: "audio-ports",
          content:
            "Audio flows through cables from outputs (right) to inputs (left). Signal type is color-coded.",
          detail:
            "Arctic-blue ports carry audio — the main signal path. CV (hot red) and trigger ports arrive in later lessons for modulation. Mismatched port types cannot connect.",
        },
        {
          id: "do-connect",
          kind: "do",
          target: '[data-tour-id="node-output"]',
          diagram: "signal-chain",
          content:
            "Route the oscillator through the analyser tap to the output node.",
          detail:
            "The analyser is a passthrough: it does not stop audio, it only taps a copy for the scopes. Any valid path from source to output counts — you do not need a direct cable.",
          requires: {
            edge: { from: "osc-1", to: "out-1" },
          },
        },
        {
          id: "demo-play",
          kind: "demo",
          target: '[data-tour-id="transport-run"]',
          diagram: "run-transport",
          content: "Press Run to hear your patch. Watch the scopes react on the right.",
          detail:
            "Press Run, then hold keys on the piano layout to hear your patch. The demo plays middle C for you. Watch the scopes react on the right.",
        },
        {
          id: "reflect",
          kind: "reflect",
          diagram: "lesson-complete",
          content:
            "You patched audio from source to destination. Next lessons add envelopes, filters, and layers.",
          detail:
            "Playground mode unlocks the full node palette you've earned so far. You can add nodes, delete with Backspace, and undo with Ctrl+Z.",
        },
      ],
    },
  ],
});
