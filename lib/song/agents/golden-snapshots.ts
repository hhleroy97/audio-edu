import { hashSongInputs } from "../render-offline";
import { runArrangement } from "./arrangement-agent";
import { RIDDIM_STANDARD_16, RIDDIM_SICK_DROP_16 } from "./rule-packs";

export type GoldenSnapshotSpec = {
  rulePackId: string;
  seed: string;
  /** Minimum expected values — hash varies with pipeline version. */
  minDropNotes: number;
  minDrumHits: number;
  minSections: number;
};

export const GOLDEN_ARRANGEMENT_SNAPSHOTS: GoldenSnapshotSpec[] = [
  {
    rulePackId: RIDDIM_STANDARD_16.id,
    seed: "golden-standard",
    minDropNotes: 4,
    minDrumHits: 24,
    minSections: 5,
  },
  {
    rulePackId: RIDDIM_SICK_DROP_16.id,
    seed: "golden-sick-drop",
    minDropNotes: 4,
    minDrumHits: 24,
    minSections: 5,
  },
];

export function verifyGoldenSnapshot(spec: GoldenSnapshotSpec): {
  ok: boolean;
  inputsHash: string;
  errors: string[];
} {
  const run = runArrangement({
    rulePackId: spec.rulePackId,
    seed: spec.seed,
  });
  const errors: string[] = [];
  const hash = run.inputsHash ?? hashSongInputs(run.song);

  if (run.song.sections.length < spec.minSections) {
    errors.push(`sections ${run.song.sections.length} < ${spec.minSections}`);
  }

  const dropNotes = run.song.sections
    .filter((s) => s.id.includes("drop"))
    .flatMap((s) => s.events.filter((e) => e.kind === "note")).length;

  if (dropNotes < spec.minDropNotes) {
    errors.push(`drop notes ${dropNotes} < ${spec.minDropNotes}`);
  }

  const drums = run.song.drums?.hits.length ?? 0;
  if (drums < spec.minDrumHits) {
    errors.push(`drum hits ${drums} < ${spec.minDrumHits}`);
  }

  return { ok: errors.length === 0, inputsHash: hash, errors };
}
