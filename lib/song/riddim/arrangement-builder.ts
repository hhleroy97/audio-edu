import { SongDef, type SectionDefType, type SongDefType } from "@/lib/schemas/song";
import { expandModProfile } from "./mod-schemas";
import {
  buildHalftimeGroove,
  buildLayerGainRamp,
  buildSparseIntroSub,
  buildTopOffbeatStabs,
  DEFAULT_BODY_MIDI,
  DEFAULT_RIDDIM_LAYERS,
  DEFAULT_SUB_MIDI,
} from "./patterns";

export type RiddimSectionKind =
  | "intro"
  | "build"
  | "drop"
  | "break"
  | "outro";

export type RiddimSectionSpec = {
  id: string;
  label: string;
  kind: RiddimSectionKind;
  startBar: number;
  endBar: number;
  /** Body preset override for this section (drop B swap). */
  bodyPresetId?: string;
  modProfileId?: string;
  topModProfileId?: string;
  muteLayers?: string[];
  combinator?: "stack" | "cat" | "slow";
  includeTop?: boolean;
};

export type RiddimArrangementConfig = {
  id: string;
  title: string;
  bpm?: number;
  bars: number;
  beatsPerBar?: number;
  key?: string;
  layers?: SongDefType["layers"];
  sections: RiddimSectionSpec[];
  gate?: "auto" | "human-review";
};

function sectionBarCount(spec: RiddimSectionSpec): number {
  return spec.endBar - spec.startBar;
}

function buildSectionEvents(spec: RiddimSectionSpec): SectionDefType["events"] {
  const bars = sectionBarCount(spec);
  const events: SectionDefType["events"] = [];

  switch (spec.kind) {
    case "intro":
      events.push(...buildSparseIntroSub(bars));
      break;
    case "build":
      events.push(...buildSparseIntroSub(bars));
      events.push(
        ...buildLayerGainRamp({
          layer: "body",
          startGain: 0,
          endGain: 0.28,
          startBeat: 0,
          endBeat: Math.max(1, bars * 4 - 1),
        })
      );
      events.push(
        ...buildHalftimeGroove({
          bars,
          layers: [{ layer: "body", durationBeats: 1.5 }],
          bodyDurationScale: 0.9,
        })
      );
      break;
    case "drop": {
      events.push({
        kind: "layerGain",
        beat: 0,
        layer: "body",
        gain: spec.bodyPresetId ? 0.45 : 0.48,
      });
      if (spec.bodyPresetId) {
        events.push({
          kind: "layerPreset",
          beat: 0,
          layer: "body",
          presetId: spec.bodyPresetId,
        });
      }
      if (spec.includeTop) {
        events.push({
          kind: "layerGain",
          beat: 0,
          layer: "top",
          gain: 0.22,
        });
      }
      events.push(
        ...buildHalftimeGroove({
          bars,
          layers: [
            { layer: "sub", durationBeats: 1.92 },
            { layer: "body", durationBeats: 1.68 },
          ],
        })
      );
      if (spec.includeTop) {
        events.push(...buildTopOffbeatStabs(0, bars));
      }
      if (spec.modProfileId) {
        events.push(...expandModProfile(spec.modProfileId, "body"));
      }
      if (spec.topModProfileId) {
        events.push(...expandModProfile(spec.topModProfileId, "top"));
      }
      break;
    }
    case "break":
      events.push(
        ...buildHalftimeGroove({
          bars,
          layers: [{ layer: "sub", durationBeats: 1.75 }],
        })
      );
      break;
    case "outro":
      events.push(
        { kind: "layerGain", beat: 0, layer: "body", gain: 0 },
        { kind: "layerGain", beat: 0, layer: "top", gain: 0 },
        { kind: "layerGain", beat: 0, layer: "sub", gain: 0.45 }
      );
      events.push(
        ...buildHalftimeGroove({
          bars,
          layers: [{ layer: "sub", durationBeats: 1.4 }],
        })
      );
      break;
  }

  return events;
}

/** Compile declarative section specs → validated SongDef v2. */
export function buildRiddimArrangement(
  config: RiddimArrangementConfig
): SongDefType {
  const beatsPerBar = config.beatsPerBar ?? 4;
  const layerIds = new Set((config.layers ?? DEFAULT_RIDDIM_LAYERS).map((l) => l.id));

  const sections: SectionDefType[] = config.sections.map((spec) => ({
    id: spec.id,
    label: spec.label,
    startBar: spec.startBar,
    endBar: spec.endBar,
    combinator: spec.combinator,
    muteLayers:
      spec.muteLayers ?? defaultMuteForKind(spec.kind, layerIds),
    events: buildSectionEvents(spec),
  }));

  return SongDef.parse({
    meta: {
      id: config.id,
      title: config.title,
      bpm: config.bpm ?? 140,
      key: config.key ?? "F#",
      rootMidi: DEFAULT_BODY_MIDI,
      bars: config.bars,
      beatsPerBar,
      gate: config.gate ?? "human-review",
      version: 2,
    },
    schemaVersion: 2,
    layers: config.layers ?? DEFAULT_RIDDIM_LAYERS,
    sections,
  });
}

function defaultMuteForKind(
  kind: RiddimSectionKind,
  layerIds: Set<string>
): string[] | undefined {
  let candidates: string[] = [];
  switch (kind) {
    case "intro":
    case "break":
      candidates = ["body", "top"];
      break;
    case "build":
      candidates = ["top"];
      break;
    case "outro":
      candidates = ["body", "top"];
      break;
    default:
      return undefined;
  }
  const muted = candidates.filter((id) => layerIds.has(id));
  return muted.length > 0 ? muted : undefined;
}

/** 16-bar sick drop — build → drop A (hydraulic swell) → break → drop B (FM throw). */
export const riddimSickDrop16 = buildRiddimArrangement({
  id: "riddim-sick-drop-16",
  title: "Riddim Sick Drop 16",
  bars: 16,
  sections: [
    {
      id: "intro",
      label: "Intro",
      kind: "intro",
      startBar: 0,
      endBar: 2,
    },
    {
      id: "build",
      label: "Build",
      kind: "build",
      startBar: 2,
      endBar: 4,
    },
    {
      id: "drop-a",
      label: "Drop A",
      kind: "drop",
      startBar: 4,
      endBar: 8,
      modProfileId: "hydraulic-drop-swell",
    },
    {
      id: "break",
      label: "Break",
      kind: "break",
      startBar: 8,
      endBar: 12,
    },
    {
      id: "drop-b",
      label: "Drop B",
      kind: "drop",
      startBar: 12,
      endBar: 16,
      combinator: "cat",
      bodyPresetId: "harsh-square-fm",
      modProfileId: "drop-b-preset-swap-throw",
    },
  ],
});

/** 32-bar set with top layer + dual mod profiles on extended drops. */
export const riddimSickDrop32 = buildRiddimArrangement({
  id: "riddim-sick-drop-32",
  title: "Riddim Sick Drop 32",
  bars: 32,
  layers: [
    {
      id: "sub",
      presetId: "clean-sub",
      mixProfile: "sub",
      busGain: 0.72,
      songGain: 0.82,
      defaultMidi: DEFAULT_SUB_MIDI,
    },
    {
      id: "body",
      presetId: "infekt-constant-motion",
      mixProfile: "body",
      busGain: 0.48,
      songGain: 0.58,
      defaultMidi: DEFAULT_BODY_MIDI,
    },
    {
      id: "top",
      presetId: "pro-metallic-comb",
      mixProfile: "top",
      busGain: 0.28,
      songGain: 0.42,
      defaultMidi: DEFAULT_BODY_MIDI,
    },
  ],
  sections: [
    {
      id: "intro",
      label: "Intro",
      kind: "intro",
      startBar: 0,
      endBar: 4,
    },
    {
      id: "drop-a",
      label: "Drop A",
      kind: "drop",
      startBar: 4,
      endBar: 12,
      includeTop: true,
      modProfileId: "infekt-constant-motion",
      topModProfileId: "macro-comb-top-stab",
    },
    {
      id: "break-a",
      label: "Break A",
      kind: "break",
      startBar: 12,
      endBar: 16,
    },
    {
      id: "drop-b",
      label: "Drop B",
      kind: "drop",
      startBar: 16,
      endBar: 24,
      includeTop: true,
      bodyPresetId: "harsh-square-fm",
      modProfileId: "dual-lfo-fm-drop",
      topModProfileId: "macro-comb-top-stab",
    },
    {
      id: "break-b",
      label: "Break B",
      kind: "break",
      startBar: 24,
      endBar: 28,
    },
    {
      id: "outro",
      label: "Outro",
      kind: "outro",
      startBar: 28,
      endBar: 32,
    },
  ],
});

export const RIDDIM_ARRANGEMENT_TEMPLATES = [
  { id: riddimSickDrop16.meta.id, title: riddimSickDrop16.meta.title, song: riddimSickDrop16 },
  { id: riddimSickDrop32.meta.id, title: riddimSickDrop32.meta.title, song: riddimSickDrop32 },
];
