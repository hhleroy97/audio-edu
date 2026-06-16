import type { NodeKind } from "./ports";
import type { PatchMode } from "./store";
import { LESSONS } from "./lessons/index";

export type ParamUnlockContext = {
  mode: PatchMode;
  lessonSlug: string;
  tourStepIndex: number;
};

type ParamUnlockRule = {
  lessonSlug: string;
  minStep: number;
};

/** When a param becomes visible during guided lessons (playground shows all). */
export const NODE_PARAM_UNLOCKS: Partial<
  Record<NodeKind, Record<string, ParamUnlockRule>>
> = {
  oscillator: {
    gain: { lessonSlug: "01-oscillator", minStep: 1 },
  },
  detune: {
    voices: { lessonSlug: "02-unison", minStep: 0 },
    detune: { lessonSlug: "02-unison", minStep: 1 },
    spread: { lessonSlug: "02-unison", minStep: 1 },
    gain: { lessonSlug: "02-unison", minStep: 3 },
  },
  unison: {
    voices: { lessonSlug: "02-unison", minStep: 0 },
    detune: { lessonSlug: "02-unison", minStep: 1 },
    spread: { lessonSlug: "02-unison", minStep: 1 },
    gain: { lessonSlug: "02-unison", minStep: 3 },
  },
  envelope: {
    attack: { lessonSlug: "03-envelope", minStep: 1 },
    decay: { lessonSlug: "03-envelope", minStep: 1 },
    sustain: { lessonSlug: "03-envelope", minStep: 1 },
    release: { lessonSlug: "03-envelope", minStep: 1 },
    gain: { lessonSlug: "03-envelope", minStep: 4 },
  },
};

function lessonIndex(slug: string): number {
  return LESSONS.findIndex((l) => l.slug === slug);
}

export function isParamUnlocked(
  nodeKind: NodeKind,
  paramId: string,
  ctx: ParamUnlockContext
): boolean {
  if (ctx.mode === "playground") return true;

  const rule = NODE_PARAM_UNLOCKS[nodeKind]?.[paramId];
  if (!rule) return true;

  const currentIdx = lessonIndex(ctx.lessonSlug);
  const ruleIdx = lessonIndex(rule.lessonSlug);
  if (currentIdx < 0 || ruleIdx < 0) return true;

  if (currentIdx > ruleIdx) return true;

  if (ctx.lessonSlug === rule.lessonSlug) {
    return ctx.tourStepIndex >= rule.minStep;
  }

  return false;
}

export function unlockedParamCount(
  nodeKind: NodeKind,
  paramIds: string[],
  ctx: ParamUnlockContext
): number {
  return paramIds.filter((id) => isParamUnlocked(nodeKind, id, ctx)).length;
}
