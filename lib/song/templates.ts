import type { SongDefType } from "@/lib/schemas/song";
import { SongDef } from "@/lib/schemas/song";
import { MULTIBUS_SONG_TEMPLATES } from "./templates/multibus-riddim";

export { MULTIBUS_SONG_TEMPLATES, isMultibusSong } from "./templates/multibus-riddim";

/** F#1 sub, F#2 body — halftime note grid for one bar (local beats). */
function halftimeNoteEvents(
  layers: { layer: string; midi: number; durationBeats: number }[],
  beatsPerBar = 4
): SongDefType["sections"][0]["events"] {
  const events: SongDefType["sections"][0]["events"] = [];
  for (let beat = 0; beat < beatsPerBar; beat += 2) {
    for (const { layer, midi, durationBeats } of layers) {
      events.push({
        kind: "note",
        beat,
        layer,
        midi,
        durationBeats,
      });
    }
  }
  return events;
}

/** 8-bar drop — clean sub + pro dual-LFO growl (MVP vertical slice). */
export const riddimDrop01: SongDefType = SongDef.parse({
  meta: {
    id: "riddim-drop-01",
    title: "Riddim Drop 01",
    bpm: 140,
    key: "F#",
    rootMidi: 42,
    bars: 8,
    beatsPerBar: 4,
    gate: "human-review",
    version: 1,
  },
  patches: [
    { layer: "sub", presetId: "clean-sub", defaultMidi: 30 },
    { layer: "body", presetId: "pro-dual-lfo-growl", defaultMidi: 42 },
  ],
  sections: [
    {
      id: "drop",
      label: "Drop",
      startBar: 0,
      endBar: 8,
      patches: [
        { layer: "sub", presetId: "clean-sub", defaultMidi: 30 },
        { layer: "body", presetId: "pro-dual-lfo-growl", defaultMidi: 42 },
      ],
      events: [
        { kind: "preset", beat: 0, layer: "body", presetId: "pro-dual-lfo-growl" },
        { kind: "preset", beat: 0, layer: "sub", presetId: "clean-sub" },
        ...Array.from({ length: 8 }, (_, bar) =>
          halftimeNoteEvents(
            [
              { layer: "sub", midi: 30, durationBeats: 1.9 },
              { layer: "body", midi: 42, durationBeats: 1.75 },
            ],
            4
          ).map((ev) => ({ ...ev, beat: ev.beat + bar * 4 }))
        ).flat(),
      ],
    },
  ],
});

/** Minimal 4-bar sub-only drop for smoke tests. */
export const riddimDropMinimal: SongDefType = SongDef.parse({
  meta: {
    id: "riddim-drop-minimal",
    title: "Riddim Drop Minimal",
    bpm: 140,
    key: "F#",
    rootMidi: 30,
    bars: 4,
    beatsPerBar: 4,
    gate: "auto",
    version: 1,
  },
  patches: [{ layer: "sub", presetId: "clean-sub", defaultMidi: 30 }],
  sections: [
    {
      id: "drop",
      label: "Minimal Drop",
      startBar: 0,
      endBar: 4,
      events: [
        { kind: "preset", beat: 0, presetId: "clean-sub" },
        ...halftimeNoteEvents([{ layer: "sub", midi: 30, durationBeats: 1.5 }]),
        ...halftimeNoteEvents([{ layer: "sub", midi: 30, durationBeats: 1.5 }]).map(
          (ev) => ({ ...ev, beat: ev.beat + 4 })
        ),
        ...halftimeNoteEvents([{ layer: "sub", midi: 30, durationBeats: 1.5 }]).map(
          (ev) => ({ ...ev, beat: ev.beat + 8 })
        ),
        ...halftimeNoteEvents([{ layer: "sub", midi: 30, durationBeats: 1.5 }]).map(
          (ev) => ({ ...ev, beat: ev.beat + 12 })
        ),
      ],
    },
  ],
});

/** 8-bar stack using riddim archetype presets on alternating bars. */
export const riddimDropArchetypeStack: SongDefType = SongDef.parse({
  meta: {
    id: "riddim-drop-archetype-stack",
    title: "Riddim Archetype Stack",
    bpm: 140,
    key: "F#",
    rootMidi: 42,
    bars: 8,
    beatsPerBar: 4,
    gate: "human-review",
    version: 1,
  },
  patches: [
    { layer: "sub", presetId: "clean-sub", defaultMidi: 30 },
    { layer: "body", presetId: "hydraulic-press-wobble", defaultMidi: 42 },
  ],
  sections: [
    {
      id: "drop-a",
      label: "Drop A",
      startBar: 0,
      endBar: 4,
      patches: [
        { layer: "sub", presetId: "clean-sub", defaultMidi: 30 },
        { layer: "body", presetId: "hydraulic-press-wobble", defaultMidi: 42 },
      ],
      events: [
        {
          kind: "preset",
          beat: 0,
          layer: "body",
          presetId: "hydraulic-press-wobble",
        },
        ...Array.from({ length: 4 }, (_, bar) =>
          halftimeNoteEvents(
            [
              { layer: "sub", midi: 30, durationBeats: 1.8 },
              { layer: "body", midi: 42, durationBeats: 1.6 },
            ],
            4
          ).map((ev) => ({ ...ev, beat: ev.beat + bar * 4 }))
        ).flat(),
      ],
    },
    {
      id: "drop-b",
      label: "Drop B",
      startBar: 4,
      endBar: 8,
      patches: [
        { layer: "sub", presetId: "clean-sub", defaultMidi: 30 },
        { layer: "body", presetId: "subfiltronik-loop", defaultMidi: 42 },
      ],
      events: [
        {
          kind: "preset",
          beat: 0,
          layer: "body",
          presetId: "subfiltronik-loop",
        },
        ...Array.from({ length: 4 }, (_, bar) =>
          halftimeNoteEvents(
            [
              { layer: "sub", midi: 30, durationBeats: 1.8 },
              { layer: "body", midi: 42, durationBeats: 1.6 },
            ],
            4
          ).map((ev) => ({ ...ev, beat: ev.beat + bar * 4 }))
        ).flat(),
      ],
    },
  ],
});

export const SONG_TEMPLATES: { id: string; title: string; song: SongDefType }[] = [
  { id: riddimDrop01.meta.id, title: riddimDrop01.meta.title, song: riddimDrop01 },
  {
    id: riddimDropMinimal.meta.id,
    title: riddimDropMinimal.meta.title,
    song: riddimDropMinimal,
  },
  {
    id: riddimDropArchetypeStack.meta.id,
    title: riddimDropArchetypeStack.meta.title,
    song: riddimDropArchetypeStack,
  },
];

export const ALL_SONG_TEMPLATES = [
  ...MULTIBUS_SONG_TEMPLATES,
  ...SONG_TEMPLATES,
];

export function getSongTemplate(id: string): SongDefType | undefined {
  return ALL_SONG_TEMPLATES.find((t) => t.id === id)?.song;
}
