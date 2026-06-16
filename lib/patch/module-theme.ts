import type { NodeKind } from "./ports";

export type ModuleTheme = {
  code: string;
  accent: string;
  accentDim: string;
  panel: string;
  led: string;
  /** Asymmetric silhouette — each module reads differently at a glance */
  clipPath: string;
  /** Header skew direction: 1 = slash right, -1 = slash left */
  slash: 1 | -1;
};

/** Eurorack-inspired module identities — brutal techno palette */
export const MODULE_THEME: Record<NodeKind, ModuleTheme> = {
  oscillator: {
    code: "VCO",
    accent: "#00e8ff",
    accentDim: "#00e8ff22",
    panel: "#0c0a12",
    led: "#00e8ff",
    clipPath:
      "polygon(14px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 22px) 100%, 0 100%, 0 14px)",
    slash: 1,
  },
  detune: {
    code: "DST",
    accent: "#ff2d95",
    accentDim: "#ff2d9522",
    panel: "#100a14",
    led: "#ff2d95",
    clipPath:
      "polygon(0 0, 100% 0, 100% 100%, 22px 100%, 0 calc(100% - 22px))",
    slash: -1,
  },
  unison: {
    code: "UNI",
    accent: "#c77dff",
    accentDim: "#c77dff22",
    panel: "#0e0a14",
    led: "#c77dff",
    clipPath:
      "polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)",
    slash: 1,
  },
  envelope: {
    code: "ENV",
    accent: "#ff3b2f",
    accentDim: "#ff3b2f22",
    panel: "#120808",
    led: "#ff3b2f",
    clipPath:
      "polygon(0 0, calc(100% - 20px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 20px))",
    slash: -1,
  },
  output: {
    code: "OUT",
    accent: "#e8e4dc",
    accentDim: "#e8e4dc18",
    panel: "#141210",
    led: "#ffd60a",
    clipPath:
      "polygon(24px 0, 100% 0, 100% 100%, 0 100%, 0 20px)",
    slash: 1,
  },
  analyser: {
    code: "SCOPE",
    accent: "#39ff14",
    accentDim: "#39ff1422",
    panel: "#060e06",
    led: "#39ff14",
    clipPath:
      "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
    slash: -1,
  },
  filter: {
    code: "VCF",
    accent: "#9d4edd",
    accentDim: "#9d4edd22",
    panel: "#0c0814",
    led: "#9d4edd",
    clipPath:
      "polygon(0 12px, 12px 0, 100% 0, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
    slash: -1,
  },
  wavetable: {
    code: "WTB",
    accent: "#00d4aa",
    accentDim: "#00d4aa22",
    panel: "#081210",
    led: "#00d4aa",
    clipPath:
      "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
    slash: 1,
  },
  mixer: {
    code: "MIX",
    accent: "#ffd60a",
    accentDim: "#ffd60a22",
    panel: "#121008",
    led: "#ffd60a",
    clipPath:
      "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
    slash: 1,
  },
  lfo: {
    code: "LFO",
    accent: "#ff006e",
    accentDim: "#ff006e22",
    panel: "#120610",
    led: "#ff006e",
    clipPath:
      "polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)",
    slash: -1,
  },
};

export function getModuleTheme(kind: NodeKind): ModuleTheme {
  return MODULE_THEME[kind] ?? MODULE_THEME.oscillator;
}
