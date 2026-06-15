import type { PortType } from "@/lib/schemas/patch";

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
  audio: "#5ec8e8",
  cv: "#e8343a",
  trigger: "#c8a85e",
};

export const NODE_COLORS: Record<string, string> = {
  oscillator: "#5ec8e8",
  output: "#8a7fa0",
  filter: "#a78bfa",
  envelope: "#e8343a",
  wavetable: "#5ec8e8",
  unison: "#5ec8e8",
  mixer: "#c8a85e",
  lfo: "#e8343a",
  analyser: "#2a1f3d",
};

export type NodeKind =
  | "oscillator"
  | "output"
  | "filter"
  | "envelope"
  | "wavetable"
  | "unison"
  | "mixer"
  | "lfo"
  | "analyser";

export type PatchNodeData = {
  label: string;
  kind: NodeKind;
  params: Record<string, number | string | boolean>;
};

export const DEFAULT_UNLOCKED: NodeKind[] = ["oscillator", "output"];
