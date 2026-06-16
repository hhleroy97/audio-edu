import type { ModAutomationType, SectionDefType } from "@/lib/schemas/song";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import {
  resolveBodyModProfile,
  resolveTopModProfile,
} from "./mod-catalog-agent";
import { expandModProfile } from "../riddim/mod-schemas";

export type AutomationAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  layerIds: Set<string>;
  seed: string;
};

export type AutomationAgentResult = {
  sections: SectionDefType[];
};

/**
 * Post-merge automation sub-agent — expands mod profiles into section events.
 * Runs only after section + pattern fragments exist.
 */
export function runAutomationAgent(
  input: AutomationAgentInput
): AutomationAgentResult {
  const { pack, layerIds, seed } = input;
  const sections = input.sections.map((section) => {
    const spec = pack.sections.find((s) => s.id === section.id);
    if (!spec) return section;

    const extraEvents = [...section.events];
    const bodyProfile = resolveBodyModProfile(pack, spec, seed);
    const topProfile = resolveTopModProfile(pack, spec, seed);

    if (bodyProfile && layerIds.has("body")) {
      extraEvents.push(...expandModProfile(bodyProfile, "body"));
    }
    if (topProfile && layerIds.has("top")) {
      extraEvents.push(...expandModProfile(topProfile, "top"));
    }

    const automations: ModAutomationType[] = [...(section.automations ?? [])];
    return {
      ...section,
      events: extraEvents,
      automations,
    };
  });

  return { sections };
}

export function lintAutomationAgent(result: AutomationAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const section of result.sections) {
    for (const ev of section.events) {
      if (ev.kind === "automation" && !ev.nodeId) {
        errors.push(`automation missing nodeId in ${section.id}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
