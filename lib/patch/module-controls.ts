import type { ModuleControlSpec } from "./ModuleControlGrid";

export const OSCILLATOR_CONTROLS: ModuleControlSpec[] = [
  {
    type: "fader",
    param: "gain",
    label: "Level",
    min: 0,
    max: 1,
    step: 0.01,
    area: "fader",
    tall: true,
  },
];

export const DETUNE_CONTROLS: ModuleControlSpec[] = [
  {
    type: "knob",
    param: "voices",
    label: "Voices",
    min: 1,
    max: 8,
    step: 1,
    area: "voices",
  },
  {
    type: "knob",
    param: "detune",
    label: "Detune",
    min: 0,
    max: 50,
    step: 0.5,
    unit: "ct",
    area: "detune",
  },
  {
    type: "knob",
    param: "spread",
    label: "Spread",
    min: 0,
    max: 1,
    step: 0.01,
    area: "spread",
  },
  {
    type: "fader",
    param: "gain",
    label: "Level",
    min: 0,
    max: 1,
    step: 0.01,
    area: "fader",
  },
];

export const ENVELOPE_CONTROLS: ModuleControlSpec[] = [
  {
    type: "knob",
    param: "attack",
    label: "Atk",
    min: 0.005,
    max: 1,
    step: 0.005,
    unit: "s",
    area: "attack",
  },
  {
    type: "knob",
    param: "decay",
    label: "Dec",
    min: 0.01,
    max: 1,
    step: 0.01,
    unit: "s",
    area: "decay",
  },
  {
    type: "knob",
    param: "sustain",
    label: "Sus",
    min: 0,
    max: 1,
    step: 0.01,
    area: "sustain",
  },
  {
    type: "knob",
    param: "release",
    label: "Rel",
    min: 0.01,
    max: 2,
    step: 0.01,
    unit: "s",
    area: "release",
  },
  {
    type: "fader",
    param: "gain",
    label: "Level",
    min: 0,
    max: 1,
    step: 0.01,
    area: "fader",
  },
];

export const OUTPUT_CONTROLS: ModuleControlSpec[] = [
  {
    type: "fader",
    param: "gain",
    label: "Master",
    min: 0,
    max: 1,
    step: 0.01,
    area: "fader",
    tall: true,
  },
];
