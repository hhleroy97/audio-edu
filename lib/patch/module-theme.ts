import type { NodeKind } from "./ports";

/** Flat UI module identity — code badge only; color comes from global tokens. */
export type ModuleTheme = {
  code: string;
};

export const MODULE_THEME: Record<NodeKind, ModuleTheme> = {
  oscillator: { code: "VCO" },
  detune: { code: "DST" },
  unison: { code: "UNI" },
  envelope: { code: "ENV" },
  output: { code: "OUT" },
  analyser: { code: "SCO" },
  filter: { code: "VCF" },
  wavetable: { code: "WTB" },
  mixer: { code: "MIX" },
  lfo: { code: "LFO" },
  fm: { code: "FMO" },
  distortion: { code: "SHP" },
  layerStack: { code: "LAY" },
  formant: { code: "FMT" },
  noise: { code: "NOZ" },
};

export function getModuleTheme(kind: NodeKind): ModuleTheme {
  return MODULE_THEME[kind] ?? MODULE_THEME.oscillator;
}
