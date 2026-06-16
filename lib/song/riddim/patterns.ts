import type { PatternEventType, SongDefType } from "@/lib/schemas/song";

const DEFAULT_SUB_MIDI = 30;
const DEFAULT_BODY_MIDI = 42;

export type HalftimeGrooveOptions = {
  startLocalBeat?: number;
  bars: number;
  beatsPerBar?: number;
  layers: { layer: string; midi?: number; durationBeats?: number }[];
  /** Riddim pocket — slightly shorter gate on body for hydraulic feel */
  bodyDurationScale?: number;
};

/** Halftime bass grid — hits on beats 0 and 2 each bar (140 → 70 BPM feel). */
export function buildHalftimeGroove(
  options: HalftimeGrooveOptions
): PatternEventType[] {
  const {
    startLocalBeat = 0,
    bars,
    beatsPerBar = 4,
    layers,
    bodyDurationScale = 1,
  } = options;

  const events: PatternEventType[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < beatsPerBar; beat += 2) {
      for (const layerDef of layers) {
        const isBody = layerDef.layer === "body" || layerDef.layer === "top";
        const baseDuration = layerDef.durationBeats ?? (isBody ? 1.7 : 1.9);
        const durationBeats =
          layerDef.layer === "body"
            ? baseDuration * bodyDurationScale
            : baseDuration;

        events.push({
          kind: "note",
          beat: startLocalBeat + bar * beatsPerBar + beat,
          layer: layerDef.layer,
          midi:
            layerDef.midi ??
            (layerDef.layer === "sub" ? DEFAULT_SUB_MIDI : DEFAULT_BODY_MIDI),
          durationBeats,
        });
      }
    }
  }
  return events;
}

/** Sparse intro sub — every other bar for tension before drop. */
export function buildSparseIntroSub(
  bars: number,
  beatsPerBar = 4,
  midi = DEFAULT_SUB_MIDI
): PatternEventType[] {
  const events: PatternEventType[] = [];
  for (let bar = 0; bar < bars; bar++) {
    if (bar % 2 === 0) {
      events.push({
        kind: "note",
        beat: bar * beatsPerBar,
        layer: "sub",
        midi,
        durationBeats: 1.85,
      });
    }
  }
  return events;
}

/** Top-layer offbeat stabs — bar 2+3 fizz common in 32-bar sets. */
export function buildTopOffbeatStabs(
  startLocalBeat: number,
  bars: number,
  beatsPerBar = 4,
  layer = "top",
  midi = DEFAULT_BODY_MIDI
): PatternEventType[] {
  const events: PatternEventType[] = [];
  for (let bar = 0; bar < bars; bar++) {
    events.push({
      kind: "note",
      beat: startLocalBeat + bar * beatsPerBar + 1,
      layer,
      midi,
      durationBeats: 0.35,
    });
    events.push({
      kind: "note",
      beat: startLocalBeat + bar * beatsPerBar + 3,
      layer,
      midi,
      durationBeats: 0.4,
    });
  }
  return events;
}

export type LayerGainRamp = {
  layer: string;
  startGain: number;
  endGain: number;
  startBeat: number;
  endBeat: number;
};

/** Section entry gain automation via discrete layerGain keyframes. */
export function buildLayerGainRamp(ramp: LayerGainRamp): PatternEventType[] {
  return [
    {
      kind: "layerGain",
      beat: ramp.startBeat,
      layer: ramp.layer,
      gain: ramp.startGain,
    },
    {
      kind: "layerGain",
      beat: ramp.endBeat,
      layer: ramp.layer,
      gain: ramp.endGain,
    },
  ];
}

export const DEFAULT_RIDDIM_LAYERS: SongDefType["layers"] = [
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
    presetId: "hydraulic-press-wobble",
    mixProfile: "body",
    busGain: 0.48,
    songGain: 0.58,
    defaultMidi: DEFAULT_BODY_MIDI,
  },
];

export { DEFAULT_SUB_MIDI, DEFAULT_BODY_MIDI };
