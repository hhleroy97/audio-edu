import type { SongDefType } from "@/lib/schemas/song";
import { SongDef } from "@/lib/schemas/song";
import {
  riddimSickDrop16,
  riddimSickDrop32,
} from "@/lib/song/riddim/arrangement-builder";

const SUB_MIDI = 30;
const BODY_MIDI = 42;

function halftimeNotes(
  startLocalBeat: number,
  bars: number,
  layers: { layer: string; midi: number; durationBeats: number }[],
  beatsPerBar = 4
): SongDefType["sections"][0]["events"] {
  const events: SongDefType["sections"][0]["events"] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < beatsPerBar; beat += 2) {
      for (const { layer, midi, durationBeats } of layers) {
        events.push({
          kind: "note",
          beat: startLocalBeat + bar * beatsPerBar + beat,
          layer,
          midi,
          durationBeats,
        });
      }
    }
  }
  return events;
}

const BASE_LAYERS = [
  {
    id: "sub",
    presetId: "clean-sub",
    mixProfile: "sub" as const,
    busGain: 0.72,
    songGain: 0.82,
    defaultMidi: SUB_MIDI,
  },
  {
    id: "body",
    presetId: "hydraulic-press-wobble",
    mixProfile: "body" as const,
    busGain: 0.48,
    songGain: 0.58,
    defaultMidi: BODY_MIDI,
  },
] as const;

/** 16 bars — intro → drop → break → drop B (multibus v2). */
export const riddim16Standard: SongDefType = SongDef.parse({
  meta: {
    id: "riddim-16-standard",
    title: "Riddim 16 Standard",
    bpm: 140,
    key: "F#",
    rootMidi: BODY_MIDI,
    bars: 16,
    beatsPerBar: 4,
    gate: "human-review",
    version: 2,
  },
  schemaVersion: 2,
  layers: [...BASE_LAYERS],
  sections: [
    {
      id: "intro",
      label: "Intro",
      startBar: 0,
      endBar: 4,
      muteLayers: ["body"],
      events: halftimeNotes(0, 4, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.85 },
      ]),
    },
    {
      id: "drop-a",
      label: "Drop A",
      startBar: 4,
      endBar: 8,
      events: [
        { kind: "layerGain", beat: 0, layer: "body", gain: 0.48 },
        ...halftimeNotes(0, 4, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.9 },
          { layer: "body", midi: BODY_MIDI, durationBeats: 1.7 },
        ]),
      ],
    },
    {
      id: "break",
      label: "Break",
      startBar: 8,
      endBar: 12,
      muteLayers: ["body"],
      events: halftimeNotes(0, 4, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.8 },
      ]),
    },
    {
      id: "drop-b",
      label: "Drop B",
      startBar: 12,
      endBar: 16,
      combinator: "cat",
      events: [
        {
          kind: "layerPreset",
          beat: 0,
          layer: "body",
          presetId: "harsh-square-fm",
        },
        { kind: "layerGain", beat: 0, layer: "body", gain: 0.45 },
        ...halftimeNotes(0, 4, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.9 },
          { layer: "body", midi: BODY_MIDI, durationBeats: 1.65 },
        ]),
      ],
    },
  ],
});

/** 32 bars — two drop/break cycles + outro fade. */
export const riddim32Set: SongDefType = SongDef.parse({
  meta: {
    id: "riddim-32-set",
    title: "Riddim 32 Set",
    bpm: 140,
    key: "F#",
    rootMidi: BODY_MIDI,
    bars: 32,
    beatsPerBar: 4,
    gate: "human-review",
    version: 2,
  },
  schemaVersion: 2,
  layers: [
    {
      id: "sub",
      presetId: "clean-sub",
      mixProfile: "sub",
      busGain: 0.72,
      songGain: 0.82,
      defaultMidi: SUB_MIDI,
    },
    {
      id: "body",
      presetId: "subfiltronik-loop",
      mixProfile: "body",
      busGain: 0.48,
      songGain: 0.58,
      defaultMidi: BODY_MIDI,
    },
    {
      id: "top",
      presetId: "pro-metallic-comb",
      mixProfile: "top",
      busGain: 0.28,
      songGain: 0.42,
      defaultMidi: BODY_MIDI,
    },
  ],
  sections: [
    {
      id: "intro",
      label: "Intro",
      startBar: 0,
      endBar: 4,
      muteLayers: ["body", "top"],
      events: halftimeNotes(0, 4, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.85 },
      ]),
    },
    {
      id: "drop-a",
      label: "Drop A",
      startBar: 4,
      endBar: 12,
      events: [
        { kind: "layerGain", beat: 0, layer: "body", gain: 0.48 },
        { kind: "layerGain", beat: 0, layer: "top", gain: 0.22 },
        ...halftimeNotes(0, 8, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.9 },
          { layer: "body", midi: BODY_MIDI, durationBeats: 1.7 },
        ]),
      ],
    },
    {
      id: "break-a",
      label: "Break A",
      startBar: 12,
      endBar: 16,
      muteLayers: ["body", "top"],
      events: halftimeNotes(0, 4, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.75 },
      ]),
    },
    {
      id: "drop-b",
      label: "Drop B",
      startBar: 16,
      endBar: 24,
      events: [
        {
          kind: "layerPreset",
          beat: 0,
          layer: "body",
          presetId: "hydraulic-press-wobble",
        },
        { kind: "layerGain", beat: 0, layer: "body", gain: 0.5 },
        { kind: "layerGain", beat: 0, layer: "top", gain: 0.24 },
        ...halftimeNotes(0, 8, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.9 },
          { layer: "body", midi: BODY_MIDI, durationBeats: 1.68 },
          { layer: "top", midi: BODY_MIDI, durationBeats: 0.45 },
        ]),
      ],
    },
    {
      id: "break-b",
      label: "Break B",
      startBar: 24,
      endBar: 28,
      muteLayers: ["body", "top"],
      events: halftimeNotes(0, 4, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.7 },
      ]),
    },
    {
      id: "outro",
      label: "Outro",
      startBar: 28,
      endBar: 32,
      events: [
        { kind: "layerGain", beat: 0, layer: "body", gain: 0 },
        { kind: "layerGain", beat: 0, layer: "top", gain: 0 },
        { kind: "layerGain", beat: 0, layer: "sub", gain: 0.5 },
        ...halftimeNotes(0, 4, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.5 },
        ]),
      ],
    },
  ],
});

/** 16 bars — minimal intro, tearout drop B. */
export const riddimTearout16: SongDefType = SongDef.parse({
  meta: {
    id: "riddim-tearout-16",
    title: "Riddim Tearout 16",
    bpm: 140,
    key: "F#",
    rootMidi: BODY_MIDI,
    bars: 16,
    beatsPerBar: 4,
    gate: "human-review",
    version: 2,
  },
  schemaVersion: 2,
  layers: [
    {
      id: "sub",
      presetId: "clean-sub",
      mixProfile: "sub",
      busGain: 0.72,
      songGain: 0.82,
      defaultMidi: SUB_MIDI,
    },
    {
      id: "body",
      presetId: "tearout-screech-sustain",
      mixProfile: "body",
      busGain: 0.45,
      songGain: 0.52,
      defaultMidi: BODY_MIDI,
    },
  ],
  sections: [
    {
      id: "intro",
      label: "Intro",
      startBar: 0,
      endBar: 2,
      muteLayers: ["body"],
      events: halftimeNotes(0, 2, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.8 },
      ]),
    },
    {
      id: "drop-a",
      label: "Drop A",
      startBar: 2,
      endBar: 8,
      events: [
        { kind: "layerGain", beat: 0, layer: "body", gain: 0.45 },
        ...halftimeNotes(0, 6, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.85 },
          { layer: "body", midi: BODY_MIDI, durationBeats: 1.6 },
        ]),
      ],
    },
    {
      id: "break",
      label: "Break",
      startBar: 8,
      endBar: 10,
      muteLayers: ["body"],
      events: halftimeNotes(0, 2, [
        { layer: "sub", midi: SUB_MIDI, durationBeats: 1.7 },
      ]),
    },
    {
      id: "drop-b",
      label: "Tearout Drop",
      startBar: 10,
      endBar: 16,
      events: [
        {
          kind: "layerPreset",
          beat: 0,
          layer: "body",
          presetId: "harsh-square-fm",
        },
        { kind: "layerGain", beat: 0, layer: "body", gain: 0.48 },
        ...halftimeNotes(0, 6, [
          { layer: "sub", midi: SUB_MIDI, durationBeats: 1.92 },
          { layer: "body", midi: BODY_MIDI, durationBeats: 1.55 },
        ]),
      ],
    },
  ],
});

export const MULTIBUS_SONG_TEMPLATES: {
  id: string;
  title: string;
  song: SongDefType;
}[] = [
  {
    id: riddim16Standard.meta.id,
    title: riddim16Standard.meta.title,
    song: riddim16Standard,
  },
  {
    id: riddim32Set.meta.id,
    title: riddim32Set.meta.title,
    song: riddim32Set,
  },
  {
    id: riddimTearout16.meta.id,
    title: riddimTearout16.meta.title,
    song: riddimTearout16,
  },
  {
    id: riddimSickDrop16.meta.id,
    title: riddimSickDrop16.meta.title,
    song: riddimSickDrop16,
  },
  {
    id: riddimSickDrop32.meta.id,
    title: riddimSickDrop32.meta.title,
    song: riddimSickDrop32,
  },
];

export function isMultibusSong(song: SongDefType): boolean {
  return song.schemaVersion >= 2 || song.layers.length > 0;
}
