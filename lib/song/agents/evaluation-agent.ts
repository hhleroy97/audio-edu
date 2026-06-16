import type { SongDefType } from "@/lib/schemas/song";
import {
  EvaluationDef,
  EvaluationReport,
  type EvaluationDefType,
  type EvaluationReportType,
} from "@/lib/schemas/harmony";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";

/** Structural quality gates — sync checks before human review (#105). */
export function runEvaluationAgent(
  song: SongDefType,
  pack: ArrangementRulePackType
): EvaluationReportType {
  const rules: EvaluationDefType = EvaluationDef.parse(
    pack.evaluation ?? {}
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  let dropNoteCount = 0;
  let totalNoteCount = 0;
  let dropSectionCount = 0;

  for (const section of song.sections) {
    const spec = pack.sections.find((s) => s.id === section.id);
    const isDrop = spec?.kind === "drop" || section.id.includes("drop");
    if (isDrop) dropSectionCount++;

    for (const ev of section.events) {
      if (ev.kind !== "note") continue;
      totalNoteCount++;
      if (isDrop && (ev.layer === "sub" || ev.layer === "body")) {
        dropNoteCount++;
      }
    }
  }

  const drumHitCount = song.drums?.hits.length ?? 0;

  if (dropSectionCount < rules.minDropSections) {
    errors.push(
      `expected ≥${rules.minDropSections} drop sections, got ${dropSectionCount}`
    );
  }
  if (dropNoteCount < rules.minDropNotes) {
    errors.push(
      `expected ≥${rules.minDropNotes} drop notes, got ${dropNoteCount}`
    );
  }
  if (drumHitCount < rules.minDrumHits) {
    errors.push(
      `expected ≥${rules.minDrumHits} drum hits, got ${drumHitCount}`
    );
  }

  if (totalNoteCount < 8) {
    warnings.push("sparse arrangement — fewer than 8 total notes");
  }

  return EvaluationReport.parse({
    ok: errors.length === 0,
    errors,
    warnings,
    metrics: {
      dropNoteCount,
      drumHitCount,
      dropSectionCount,
      totalNoteCount,
    },
  });
}

export function lintEvaluationAgent(report: EvaluationReportType): {
  ok: boolean;
  errors: string[];
} {
  return { ok: report.ok, errors: report.errors };
}
