import type { SongDefType } from "@/lib/schemas/song";
import {
  EvaluationDef,
  EvaluationReport,
  type EvaluationDefType,
  type EvaluationReportType,
} from "@/lib/schemas/harmony";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import {
  countBounceKicks,
  drumVelocityStdDev,
} from "../drums/riddim-pocket";

function chordMetricsFromSong(
  song: SongDefType,
  pack: ArrangementRulePackType
): { uniqueChordRoots: number; barChordChanges: number } {
  const rootMidis = new Set<number>();
  let barChordChanges = 0;
  const beatsPerBar = song.meta.beatsPerBar;

  for (const section of song.sections) {
    const spec = pack.sections.find((s) => s.id === section.id);
    const isDrop = spec?.kind === "drop" || section.id.includes("drop");
    if (!isDrop) continue;

    const rootsByBar = new Map<number, number>();
    for (const ev of section.events) {
      if (ev.kind !== "note" || ev.layer !== "sub" || ev.midi === undefined) continue;
      const bar = Math.floor(ev.beat / beatsPerBar);
      if (!rootsByBar.has(bar)) rootsByBar.set(bar, ev.midi);
      rootMidis.add(ev.midi);
    }

    const bars = [...rootsByBar.keys()].sort((a, b) => a - b);
    for (let i = 1; i < bars.length; i++) {
      const prev = rootsByBar.get(bars[i - 1]!);
      const cur = rootsByBar.get(bars[i]!);
      if (prev !== undefined && cur !== undefined && prev !== cur) {
        barChordChanges++;
      }
    }
  }

  return { uniqueChordRoots: rootMidis.size, barChordChanges };
}

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
  let modKeyframeCount = 0;
  const bodyPresets = new Set<string>();

  for (const section of song.sections) {
    const spec = pack.sections.find((s) => s.id === section.id);
    const isDrop = spec?.kind === "drop" || section.id.includes("drop");
    if (isDrop) dropSectionCount++;

    for (const ev of section.events) {
      if (ev.kind === "automation" && isDrop) {
        modKeyframeCount++;
      }
      if (ev.kind === "layerPreset" && ev.layer === "body") {
        bodyPresets.add(ev.presetId);
      }
      if (ev.kind !== "note") continue;
      totalNoteCount++;
      if (isDrop && (ev.layer === "sub" || ev.layer === "body")) {
        dropNoteCount++;
      }
    }
  }

  for (const layer of song.layers) {
    if (layer.id === "body") bodyPresets.add(layer.presetId);
  }

  const drumHits = song.drums?.hits ?? [];
  const drumHitCount = drumHits.length;
  const bounceKickCount = countBounceKicks(drumHits);
  const velocityStdDev = drumVelocityStdDev(drumHits);
  const uniqueBodyPresets = bodyPresets.size;

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
  if (bounceKickCount < rules.minBounceKicks) {
    errors.push(
      `expected ≥${rules.minBounceKicks} bounce kicks, got ${bounceKickCount}`
    );
  }
  if (velocityStdDev < rules.minVelocityStdDev) {
    errors.push(
      `expected velocity std dev ≥${rules.minVelocityStdDev}, got ${velocityStdDev.toFixed(3)}`
    );
  }

  const dropModKeyframes = modKeyframeCount;
  if (dropModKeyframes < rules.minModKeyframesPerDrop && dropSectionCount > 0) {
    errors.push(
      `expected ≥${rules.minModKeyframesPerDrop} mod keyframes, got ${dropModKeyframes}`
    );
  }

  if (uniqueBodyPresets < rules.minUniqueBodyPresets) {
    errors.push(
      `expected ≥${rules.minUniqueBodyPresets} body presets, got ${uniqueBodyPresets}`
    );
  }

  let sectionPresetSwaps = 0;
  for (const section of song.sections) {
    for (const ev of section.events) {
      if (ev.kind === "layerPreset") sectionPresetSwaps++;
    }
  }
  if (sectionPresetSwaps < rules.minSectionPresetSwaps) {
    errors.push(
      `expected ≥${rules.minSectionPresetSwaps} section preset swaps, got ${sectionPresetSwaps}`
    );
  }

  const { uniqueChordRoots, barChordChanges } = chordMetricsFromSong(song, pack);

  if (uniqueChordRoots < rules.minUniqueChordRoots) {
    errors.push(
      `expected ≥${rules.minUniqueChordRoots} unique chord roots, got ${uniqueChordRoots}`
    );
  }
  if (barChordChanges < rules.minBarChordChanges) {
    errors.push(
      `expected ≥${rules.minBarChordChanges} bar chord changes, got ${barChordChanges}`
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
      bounceKickCount,
      velocityStdDev,
      modKeyframeCount: dropModKeyframes,
      uniqueBodyPresets,
      sectionPresetSwaps,
      uniqueChordRoots,
      barChordChanges,
    },
  });
}

export function lintEvaluationAgent(report: EvaluationReportType): {
  ok: boolean;
  errors: string[];
} {
  return { ok: report.ok, errors: report.errors };
}
