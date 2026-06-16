import type { Node } from "@xyflow/react";
import type { NodeKind, PatchNodeData } from "./ports";

/** Node kinds that expose an audio tap for oscilloscope / FFT / spectrogram. */
export const SCOPE_TAPPABLE_KINDS: ReadonlySet<NodeKind> = new Set([
  "oscillator",
  "wavetable",
  "detune",
  "unison",
  "envelope",
  "filter",
  "mixer",
  "analyser",
  "output",
  "fm",
  "distortion",
  "layerStack",
  "formant",
  "noise",
  "multiband",
  "modFx",
  "filterBank",
]);

export function isScopeTappable(kind: NodeKind): boolean {
  return SCOPE_TAPPABLE_KINDS.has(kind);
}

export function listScopeTapCandidates(
  nodes: Node<PatchNodeData>[]
): { id: string; kind: NodeKind; label: string }[] {
  return nodes
    .filter((n) => isScopeTappable(n.data.kind))
    .map((n) => ({
      id: n.id,
      kind: n.data.kind,
      label: n.data.label || n.data.kind,
    }));
}

export function resolveDefaultScopeTapId(
  nodes: Node<PatchNodeData>[]
): string | null {
  const analyser = nodes.find((n) => n.data.kind === "analyser");
  if (analyser) return analyser.id;
  const output = nodes.find((n) => n.data.kind === "output");
  if (output) return output.id;
  const first = nodes.find((n) => isScopeTappable(n.data.kind));
  return first?.id ?? null;
}
