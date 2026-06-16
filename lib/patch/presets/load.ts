import type { Patch } from "@/lib/schemas/patch";
import { layoutLessonPatch } from "@/lib/patch/lesson-chain";
import { getPatchPreset } from "./index";

/** Layout and validate a preset into a playable Patch graph. */
export function presetToPatch(presetId: string): Patch | null {
  const preset = getPatchPreset(presetId);
  if (!preset) return null;
  return layoutLessonPatch(preset.patch);
}
