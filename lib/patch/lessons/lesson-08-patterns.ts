import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

/** Lesson 08 — Patterns vs patches (procedural song stub). */
export const lesson08Patterns: Lesson = Lesson.parse({
  slug: "08-patterns",
  title: "Patterns vs Patches",
  unlocksNodes: ["lfo", "macro"],
  startingPatch: layoutLessonPatch({
    nodes: [
      {
        id: "osc-1",
        type: "oscillator",
        params: { waveform: "sawtooth", frequency: 110, gain: 0.5 },
      },
      { id: "ana-1", type: "analyser", params: {} },
      { id: "out-1", type: "output", params: { gain: 0.65 } },
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
      title: "When vs how",
      steps: [
        {
          id: "08-explain-patterns",
          kind: "explain",
          content: "Patterns schedule when notes fire; patches define how they sound.",
          detail:
            "A song definition (SongDef) lists beats, preset ids, and layers. The scheduler fires Patch Lab at 140 BPM — Strudel-inspired IR without embedding the full REPL.",
          diagram: "signal-chain",
        },
        {
          id: "08-demo-song-panel",
          kind: "demo",
          target: "song-panel",
          content: "Open Song mode in the aside and load a riddim template.",
          detail:
            "Templates like riddim-drop-01 map sub + body presets to a halftime grid. Progress shows beat position across 8 bars.",
        },
        {
          id: "08-do-play",
          kind: "do",
          target: "song-play",
          content: "Press Play song and hear the scheduled drop.",
          detail:
            "The scheduler loads presets and triggers key gates on each note event. Transport BPM syncs LFO wobble to the grid.",
        },
        {
          id: "08-reflect",
          kind: "reflect",
          content: "Export manifest JSON — reproducible inputs hash for the same song every time.",
          detail:
            "Offline render produces song-manifest.json with preset ids, duration, and inputsHash. Human-review gate applies before publishing chunks.",
        },
      ],
    },
  ],
});
