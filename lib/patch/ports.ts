import type { PortType } from "@/lib/schemas/patch";
import type { NodeLayoutSize } from "@/lib/schemas/node-layout";

/** Handle id format: `{signal}-{role}` e.g. `audio-out`, `cv-freq` */
export function parseHandle(handle: string | null | undefined): {
  signal: PortType;
  role: string;
} | null {
  if (!handle) return null;
  const dash = handle.indexOf("-");
  if (dash < 0) return null;
  const signal = handle.slice(0, dash);
  const role = handle.slice(dash + 1);
  if (signal !== "audio" && signal !== "cv" && signal !== "trigger") return null;
  return { signal, role: role as string };
}

export function isSourceHandle(handle: string | null | undefined): boolean {
  return Boolean(handle?.endsWith("-out"));
}

export function isTargetHandle(handle: string | null | undefined): boolean {
  if (!handle) return false;
  return !handle.endsWith("-out");
}

export const PORT_COLORS: Record<PortType, string> = {
  audio: "#00e8ff",
  cv: "#ff2d95",
  trigger: "#ffd60a",
};

export const NODE_COLORS: Record<string, string> = {
  oscillator: "#00e8ff",
  output: "#e8e4dc",
  filter: "#9d4edd",
  envelope: "#ff3b2f",
  wavetable: "#00d4aa",
  unison: "#c77dff",
  detune: "#ff2d95",
  mixer: "#ffd60a",
  lfo: "#ff006e",
  analyser: "#39ff14",
};

export type NodeKind =
  | "oscillator"
  | "output"
  | "filter"
  | "envelope"
  | "wavetable"
  | "unison"
  | "detune"
  | "mixer"
  | "lfo"
  | "analyser";

export type PatchNodeData = {
  label: string;
  kind: NodeKind;
  params: Record<string, number | string | boolean>;
  /** Measured or metadata footprint for layout/collision (px). */
  layout?: NodeLayoutSize;
};

export const DEFAULT_UNLOCKED: NodeKind[] = ["oscillator", "output"];
