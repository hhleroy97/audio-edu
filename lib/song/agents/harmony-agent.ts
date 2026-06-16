import { Note, Progression, Scale } from "tonal";
import type {
  HarmonyDefType,
  SectionHarmonyPlanType,
} from "@/lib/schemas/harmony";
import type {
  ArrangementRulePackType,
  RulePackSectionKindType,
} from "@/lib/schemas/rule-pack";
import { createSeededRng } from "../pattern/tonal-notes";

const KIND_INDEX: Record<RulePackSectionKindType, number> = {
  intro: 0,
  build: 1,
  drop: 2,
  break: 1,
  outro: 0,
};

/** Map roman progression to scale degrees (1-indexed) in key+scale. */
export function progressionToDegrees(
  key: string,
  scaleName: string,
  romans: string[]
): number[] {
  const chords = Progression.fromRomanNumerals(key, romans);
  const scale = Scale.get(`${key} ${scaleName}`);
  const notes = scale.notes.length > 0 ? scale.notes : Scale.get(`${key} minor`).notes;

  return chords.map((chord) => {
    const rootMatch = chord.match(/^([A-Ga-g])([#b]?)/);
    const root = rootMatch ? `${rootMatch[1]}${rootMatch[2] ?? ""}` : chord.charAt(0);
    const chroma = Note.chroma(root);
    if (chroma === undefined) return 1;
    const idx = notes.findIndex((n) => Note.chroma(n) === chroma);
    return idx >= 0 ? idx + 1 : 1;
  });
}

function rootMidiForDegree(
  key: string,
  scaleName: string,
  degree: number,
  octave: number
): number {
  const scale = Scale.get(`${key} ${scaleName}`);
  const notes = scale.notes.length > 0 ? scale.notes : Scale.get(`${key} minor`).notes;
  const idx = ((degree - 1) % notes.length + notes.length) % notes.length;
  const name = notes[idx];
  if (!name) return 42;
  return Note.midi(`${name}${octave}`) ?? 42;
}

export type HarmonyAgentResult = {
  plans: SectionHarmonyPlanType[];
  rootMidi: number;
};

/** Per-section degree pools from roman progression + section kind. */
export function runHarmonyAgent(
  pack: ArrangementRulePackType,
  seed: string
): HarmonyAgentResult {
  const harmony: HarmonyDefType = pack.harmony ?? {
    progression: ["i", "i", "iv", "i"],
    subOctave: 1,
    bodyOctave: 2,
  };

  const degrees = progressionToDegrees(pack.key, pack.scale, harmony.progression);
  const rng = createSeededRng(`${seed}:harmony`);
  const plans: SectionHarmonyPlanType[] = [];

  for (const spec of pack.sections) {
    const kindIdx = KIND_INDEX[spec.kind] ?? 0;
    const offset = harmony.kindOffsets?.[spec.kind] ?? 0;
    const progIdx = (kindIdx + offset) % degrees.length;
    const baseDegree = degrees[progIdx] ?? 1;
    const altDegree = degrees[(progIdx + 1) % degrees.length] ?? baseDegree;

    const jitter = Math.floor(rng() * 2);
    const subDegrees = [baseDegree];
    const bodyDegrees = jitter === 0 ? [baseDegree, altDegree] : [altDegree, baseDegree];

    plans.push({
      sectionId: spec.id,
      subDegrees,
      bodyDegrees,
      rootMidi: rootMidiForDegree(
        pack.key,
        pack.scale,
        baseDegree,
        harmony.subOctave
      ),
    });
  }

  const rootMidi = rootMidiForDegree(
    pack.key,
    pack.scale,
    degrees[0] ?? 1,
    harmony.subOctave
  );

  return { plans, rootMidi };
}

export function lintHarmonyAgent(result: HarmonyAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const plan of result.plans) {
    if (plan.subDegrees.length === 0) {
      errors.push(`harmony ${plan.sectionId}: empty subDegrees`);
    }
  }
  return { ok: errors.length === 0, errors };
}
