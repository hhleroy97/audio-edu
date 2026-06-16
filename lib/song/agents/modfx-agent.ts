import type { DrumLaneDefType, SectionDefType } from "@/lib/schemas/song";
import type { ModFxDefType } from "@/lib/schemas/mod-fx";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";

export type ModFxAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  drums: DrumLaneDefType;
  layerIds: Set<string>;
};

export type ModFxAgentResult = {
  sections: SectionDefType[];
  drums: DrumLaneDefType;
};

const DEFAULT_MOD_FX: ModFxDefType = {
  defaultDrumSendReverb: 0.22,
  bySectionKind: {
    intro: {},
    build: { topModProfileId: "macro-comb-top-stab", drumSendReverb: 0.12 },
    drop: {
      bodyModProfileId: "hydraulic-drop-swell",
      topModProfileId: "macro-comb-top-stab",
      drumSendReverb: 0.28,
      drumSendDelay: 0.15,
    },
    break: { drumSendReverb: 0.08 },
    outro: { topModProfileId: "macro-comb-top-stab" },
  },
};

/** Extend automation + drum send FX per section kind (#104). */
export function runModFxAgent(input: ModFxAgentInput): ModFxAgentResult {
  const modFx: ModFxDefType = {
    ...DEFAULT_MOD_FX,
    ...input.pack.modFx,
    bySectionKind: {
      ...DEFAULT_MOD_FX.bySectionKind,
      ...input.pack.modFx?.bySectionKind,
    },
  };

  let maxReverb = modFx.defaultDrumSendReverb;
  let maxDelay = 0;

  const sections = input.sections.map((section) => {
    const spec = input.pack.sections.find((s) => s.id === section.id);
    if (!spec) return section;

    const fxSpec =
      modFx.bySectionKind?.[spec.kind] ?? {};

    const extraEvents = [...section.events];

    const reverbMix =
      fxSpec.drumSendReverb ?? modFx.defaultDrumSendReverb;
    const delayMix = fxSpec.drumSendDelay ?? 0;

    extraEvents.push({
      kind: "drumSendFx" as const,
      beat: 0,
      reverbMix,
      delayMix,
    });

    if (fxSpec.drumSendReverb !== undefined) {
      maxReverb = Math.max(maxReverb, fxSpec.drumSendReverb);
    }
    if (fxSpec.drumSendDelay !== undefined) {
      maxDelay = Math.max(maxDelay, fxSpec.drumSendDelay);
    }

    return { ...section, events: extraEvents };
  });

  return {
    sections,
    drums: {
      ...input.drums,
      sendFx: {
        reverbMix: maxReverb,
        delayMix: maxDelay,
      },
    },
  };
}

export function lintModFxAgent(result: ModFxAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const section of result.sections) {
    for (const ev of section.events) {
      if (ev.kind === "automation" && !ev.nodeId) {
        errors.push(`modfx automation missing nodeId in ${section.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export { DEFAULT_MOD_FX };
