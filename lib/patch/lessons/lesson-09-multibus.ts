import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

/** Lesson 09 — Multibus layering and riddim arrangement. */
export const lesson09Multibus: Lesson = Lesson.parse({
  slug: "09-multibus",
  title: "Multibus Arrangement",
  unlocksNodes: ["mixer", "lfo", "macro"],
  startingPatch: layoutLessonPatch({
    nodes: [
      {
        id: "osc-sub",
        type: "oscillator",
        params: { waveform: "sine", frequency: 55, gain: 0.8 },
      },
      {
        id: "osc-body",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.45 },
      },
      {
        id: "mix-1",
        type: "mixer",
        params: { gainA: 0.65, gainB: 0.5, gain: 0.75 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.7 } },
    ],
    edges: [
      {
        id: "e-sub-mix",
        source: "osc-sub",
        sourceHandle: "audio-out",
        target: "mix-1",
        targetHandle: "audio-in-a",
        signal: "audio",
      },
      {
        id: "e-body-mix",
        source: "osc-body",
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
  }),
  pages: [
    {
      title: "Layers at once",
      steps: [
        {
          id: "09-explain-multibus",
          kind: "explain",
          content:
            "Riddim uses parallel buses — sub stays clean while the body wobbles.",
          detail:
            "SongLayerEngine loads one preset per layer into a master bus. No hot-swapping the whole graph on every note.",
          diagram: "signal-chain",
        },
        {
          id: "09-demo-arrangement",
          kind: "demo",
          target: "song-panel",
          content:
            "Load riddim-16-standard — intro (sub only), drop, break, drop B.",
          detail:
            "Section muteLayers duck the body bus. layerPreset swaps the growl preset at drop B.",
        },
        {
          id: "09-do-play",
          kind: "do",
          target: "song-play",
          content: "Play the multibus template and listen for simultaneous sub + body.",
        },
        {
          id: "09-reflect",
          kind: "reflect",
          content:
            "Export stem manifest — one entry per layer preset for reproducible bounce.",
        },
      ],
    },
  ],
});
