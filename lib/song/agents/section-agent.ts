import type { SectionDefType } from "@/lib/schemas/song";
import type {
  ArrangementRulePackType,
  RulePackSectionSpecType,
} from "@/lib/schemas/rule-pack";

export type SectionAgentResult = {
  sections: SectionDefType[];
};

function defaultMuteForKind(
  kind: RulePackSectionSpecType["kind"],
  layerIds: Set<string>
): string[] | undefined {
  let candidates: string[] = [];
  switch (kind) {
    case "intro":
    case "break":
      candidates = ["body", "top"];
      break;
    case "build":
      candidates = ["top"];
      break;
    case "outro":
      candidates = ["body", "top"];
      break;
    default:
      return undefined;
  }
  const muted = candidates.filter((id) => layerIds.has(id));
  return muted.length > 0 ? muted : undefined;
}

/** Build section skeletons (no pattern events yet). */
export function runSectionAgent(
  pack: ArrangementRulePackType,
  layerIds: Set<string>
): SectionAgentResult {
  const sections: SectionDefType[] = pack.sections.map((spec) => ({
    id: spec.id,
    label: spec.label,
    startBar: spec.startBar,
    endBar: spec.endBar,
    combinator: spec.combinator,
    muteLayers:
      spec.muteLayers ?? defaultMuteForKind(spec.kind, layerIds),
    events: [],
  }));
  return { sections };
}

export function lintSectionAgent(result: SectionAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const s of result.sections) {
    if (s.endBar <= s.startBar) {
      errors.push(`section ${s.id}: endBar must exceed startBar`);
    }
  }
  return { ok: errors.length === 0, errors };
}
