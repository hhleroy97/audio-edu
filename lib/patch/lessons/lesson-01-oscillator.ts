import { Lesson } from "@/lib/schemas/patch";

export const lesson01Oscillator: Lesson = Lesson.parse({
  slug: "01-oscillator",
  title: "Oscillator Basics",
  unlocksNodes: ["oscillator", "output", "analyser"],
  startingPatch: {
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        position: { x: 80, y: 120 },
        params: { waveform: "sine", frequency: 220, gain: 0.5 },
      },
      {
        id: "out-1",
        type: "output",
        position: { x: 480, y: 120 },
        params: { gain: 0.8 },
      },
      {
        id: "ana-1",
        type: "analyser",
        position: { x: 280, y: 120 },
        params: {},
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
  },
  pages: [
    {
      title: "Signal path",
      steps: [
        {
          id: "explain-osc",
          kind: "explain",
          target: '[data-tour-id="node-oscillator"]',
          content:
            "An oscillator generates periodic waveforms. This is where sound begins in subtractive synthesis.",
        },
        {
          id: "explain-cable",
          kind: "explain",
          target: '[data-tour-id="port-audio-out"]',
          content:
            "Audio flows through cables from outputs (right) to inputs (left). Signal type is color-coded.",
        },
        {
          id: "do-connect",
          kind: "do",
          target: '[data-tour-id="node-output"]',
          content: "Connect the oscillator output through the analyser tap to the output node.",
          requires: {
            edge: { from: "osc-1", to: "out-1" },
          },
        },
        {
          id: "demo-play",
          kind: "demo",
          target: '[data-tour-id="transport-run"]',
          content: "Press Run to hear your patch. Watch the scopes react on the right.",
        },
        {
          id: "reflect",
          kind: "reflect",
          content:
            "You patched audio from source to destination. Next lessons add envelopes, filters, and layers.",
        },
      ],
    },
  ],
});
