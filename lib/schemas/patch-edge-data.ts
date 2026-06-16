import { z } from "zod";

/** React Flow edge.data for CV modulation routes (not persisted in PatchPreset edges). */
export const PatchEdgeData = z.object({
  signal: z.enum(["audio", "cv", "trigger"]).optional(),
  modDepth: z.number().min(-1).max(1).optional(),
  modOffset: z.number().min(-1).max(1).optional(),
  modBipolar: z.boolean().optional(),
});

export type PatchEdgeData = z.infer<typeof PatchEdgeData>;

export const DEFAULT_CV_EDGE_DATA: Required<
  Pick<PatchEdgeData, "modDepth" | "modOffset" | "modBipolar">
> = {
  modDepth: 0.5,
  modOffset: 0,
  modBipolar: true,
};

/** Migrate legacy unipolar depth 0…2 to bipolar −1…+1. */
export function normalizeModDepth(depth: number | undefined): number {
  if (depth === undefined) return DEFAULT_CV_EDGE_DATA.modDepth;
  if (depth > 1) return Math.max(-1, Math.min(1, depth / 2));
  return Math.max(-1, Math.min(1, depth));
}

export function parseCvEdgeData(
  data: Record<string, unknown> | undefined
): Required<Pick<PatchEdgeData, "modDepth" | "modOffset" | "modBipolar">> & {
  signal?: PatchEdgeData["signal"];
} {
  const parsed = PatchEdgeData.safeParse(data ?? {});
  const modDepth = normalizeModDepth(
    parsed.success ? parsed.data.modDepth : undefined
  );
  const modOffset = parsed.success
    ? Math.max(-1, Math.min(1, parsed.data.modOffset ?? 0))
    : 0;
  const modBipolar = parsed.success ? (parsed.data.modBipolar ?? true) : true;
  return {
    signal: parsed.success ? parsed.data.signal : undefined,
    modDepth,
    modOffset,
    modBipolar,
  };
}
