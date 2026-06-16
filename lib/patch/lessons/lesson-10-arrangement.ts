import { Lesson } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";

/** Lesson 10 — Arrangement agents and procedural song generation. */
export const lesson10Arrangement: Lesson = Lesson.parse({
  slug: "10-arrangement-agents",
  title: "Arrangement Agents",
  unlocksNodes: ["macro", "lfo", "mixer"],
  startingPatch: layoutLessonPatch({
    nodes: [
      {
        id: "osc-sub",
        type: "oscillator",
        params: { waveform: "sine", frequency: 55, gain: 0.75 },
      },
      {
        id: "lfo-1",
        type: "lfo",
        params: { rate: 0.5, depth: 0.4, shape: "sine" },
      },
      { id: "mix-1", type: "mixer", params: { gainA: 0.7, gain: 0.75 } },
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
        id: "e-mix-out",
        source: "mix-1",
        sourceHandle: "audio-out",
        target: "out-1",
        targetHandle: "audio-in",
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
    ],
  }),
  pages: [
    {
      title: "Rule packs",
      steps: [
        {
          id: "10-explain-packs",
          kind: "explain",
          content:
            "Song mode can generate full riddim arrangements from rule packs.",
          detail:
            "Section structure, tonal bass patterns, drums, and mod automation merge into a validated SongDef.",
        },
        {
          id: "10-explain-agents",
          kind: "explain",
          content:
            "An ArrangementAgent supervisor runs sub-agents in fixed order.",
          detail:
            "Sections → patterns (tonal) → drums → automation. Each step lints before merge.",
        },
        {
          id: "10-do-generate",
          kind: "do",
          target: "song-panel",
          content:
            "Pick a rule pack, set a seed, and hit Generate. Play the result.",
        },
        {
          id: "10-reflect",
          kind: "reflect",
          content:
            "Export SongDef JSON. Generated songs default to human-review gate.",
        },
      ],
    },
  ],
});
