import { Chord, Note, Progression, Scale, Voicing } from "tonal";
import type {
  BarHarmonySlotType,
  HarmonyDefType,
  SectionHarmonyPlanType,
} from "@/lib/schemas/harmony";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import type { HarmonyAgentResult } from "./harmony-agent";
import { progressionToDegrees, rootMidiForDegree } from "./harmony-agent";
import { midiFromScaleDegree } from "../pattern/tonal-notes";

const BASS_VOICING_DICT: Record<string, string[]> = {
  "": ["1P 5P"],
  m: ["1P 5P"],
  m7: ["1P 5P 7m"],
  sus4: ["1P 4P 5P"],
  sus2: ["1P 2M 5P"],
};

function scaleName(pack: ArrangementRulePackType, harmony: HarmonyDefType): string {
  return harmony.scaleOverride ?? pack.scale;
}

function degreeForNote(key: string, scaleNameStr: string, noteName: string): number {
  const scale = Scale.get(`${key} ${scaleNameStr}`);
  const notes =
    scale.notes.length > 0 ? scale.notes : Scale.get(`${key} minor`).notes;
  const chroma = Note.chroma(noteName);
  if (chroma === undefined) return 1;
  const idx = notes.findIndex((n) => Note.chroma(n) === chroma);
  return idx >= 0 ? idx + 1 : 1;
}

function bodyDegreesForChord(
  key: string,
  scaleNameStr: string,
  chordSymbol: string,
  rootDegree: number,
  voicingMode: HarmonyDefType["voicingMode"]
): number[] {
  if (voicingMode === "root") {
    return [rootDegree];
  }

  const parsed = Chord.get(chordSymbol);
  const rootName = parsed.tonic;
  if (!rootName) return [rootDegree];

  const fifthName = Note.transpose(rootName, "5P");
  if (!fifthName) return [rootDegree];

  const fifthDegree = degreeForNote(key, scaleNameStr, fifthName);
  return rootDegree === fifthDegree
    ? [rootDegree]
    : [rootDegree, fifthDegree];
}

function bodyMidisForSlot(
  pack: ArrangementRulePackType,
  harmony: HarmonyDefType,
  chordSymbol: string,
  rootDegree: number,
  bodyDegrees: number[]
): number[] {
  const scaleNameStr = scaleName(pack, harmony);
  const bodyOctave = harmony.bodyOctave;

  if (harmony.voicingMode === "root") {
    return [
      midiFromScaleDegree(pack.key, scaleNameStr, rootDegree, bodyOctave),
    ];
  }

  if (harmony.voicingMode === "fifth") {
    return bodyDegrees.map((degree) =>
      midiFromScaleDegree(pack.key, scaleNameStr, degree, bodyOctave)
    );
  }

  const bassHigh = Note.transpose(pack.key, "4P") ?? "B";
  const range: [string, string] = [`${pack.key}1`, `${bassHigh}4`];
  const voicings = Voicing.search(chordSymbol, range, BASS_VOICING_DICT);
  const picked = voicings[0] ?? voicings[voicings.length - 1];

  if (picked?.length) {
    let midis = picked
      .map((name) => Note.midi(name))
      .filter((m): m is number => m !== undefined);
    if (harmony.voicingMode === "spread" && midis.length >= 2) {
      midis = [...midis, midis[1]! + 12];
    }
    if (midis.length > 0) {
      return [...new Set(midis)].slice(0, 4);
    }
  }

  return bodyDegrees.map((degree) =>
    midiFromScaleDegree(pack.key, scaleNameStr, degree, bodyOctave)
  );
}

/** Bar-aligned roman progression → per-bar degree slots (#106). */
export function runChordVoicingAgent(
  pack: ArrangementRulePackType,
  harmonyResult: HarmonyAgentResult
): HarmonyAgentResult {
  const harmony: HarmonyDefType = pack.harmony ?? {
    progression: ["i", "i", "iv", "i"],
    subOctave: 1,
    bodyOctave: 2,
    voicingMode: "root",
    barsPerChord: 1,
  };

  const scaleNameStr = scaleName(pack, harmony);
  const romans = harmony.progression;
  const chordSymbols = Progression.fromRomanNumerals(pack.key, romans);
  const degrees = progressionToDegrees(pack.key, scaleNameStr, romans);

  const plans: SectionHarmonyPlanType[] = [];

  for (const spec of pack.sections) {
    const basePlan = harmonyResult.plans.find((p) => p.sectionId === spec.id);
    if (!basePlan) continue;

    const sectionBars = spec.endBar - spec.startBar;
    const barSlots: BarHarmonySlotType[] = [];

    for (let bar = 0; bar < sectionBars; bar += harmony.barsPerChord) {
      const slotIdx = Math.floor(bar / harmony.barsPerChord) % romans.length;
      const chordSymbol = chordSymbols[slotIdx] ?? `${pack.key}m`;
      const rootDegree = degrees[slotIdx] ?? 1;
      const bodyDegrees = bodyDegreesForChord(
        pack.key,
        scaleNameStr,
        chordSymbol,
        rootDegree,
        harmony.voicingMode === "triad" || harmony.voicingMode === "spread"
          ? "fifth"
          : harmony.voicingMode
      );
      const bodyMidis = bodyMidisForSlot(
        pack,
        harmony,
        chordSymbol,
        rootDegree,
        bodyDegrees
      );

      barSlots.push({
        barOffset: bar,
        chordSymbol,
        subDegree: rootDegree,
        bodyDegrees,
        rootMidi: rootMidiForDegree(
          pack.key,
          scaleNameStr,
          rootDegree,
          harmony.subOctave
        ),
        bodyMidis,
      });
    }

    const first = barSlots[0];
    plans.push({
      ...basePlan,
      subDegrees: first ? [first.subDegree] : basePlan.subDegrees,
      bodyDegrees: first?.bodyDegrees ?? basePlan.bodyDegrees,
      rootMidi: first?.rootMidi ?? basePlan.rootMidi,
      barSlots,
    });
  }

  const rootMidi =
    plans[0]?.rootMidi ??
    rootMidiForDegree(pack.key, scaleNameStr, degrees[0] ?? 1, harmony.subOctave);

  return { plans, rootMidi };
}

export function lintChordVoicingAgent(result: HarmonyAgentResult): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const plan of result.plans) {
    if (!plan.barSlots?.length) {
      errors.push(`chord voicing ${plan.sectionId}: missing barSlots`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function countUniqueChordRoots(plans: SectionHarmonyPlanType[]): number {
  const roots = new Set<number>();
  for (const plan of plans) {
    for (const slot of plan.barSlots ?? []) {
      roots.add(slot.subDegree);
    }
  }
  return roots.size;
}

export function countBarChordChanges(plans: SectionHarmonyPlanType[]): number {
  let changes = 0;
  for (const plan of plans) {
    const slots = plan.barSlots ?? [];
    for (let i = 1; i < slots.length; i++) {
      if (slots[i]!.subDegree !== slots[i - 1]!.subDegree) changes++;
    }
  }
  return changes;
}

/** Max body notes sharing the same beat in selected sections (#121). */
export function countMaxSimultaneousBodyNotes(
  sections: { id: string; events: { kind: string; layer?: string; beat?: number; midi?: number }[] }[],
  sectionIds: Set<string>
): number {
  let max = 0;
  for (const section of sections) {
    if (!sectionIds.has(section.id)) continue;
    const byBeat = new Map<number, number>();
    for (const ev of section.events) {
      if (ev.kind !== "note" || ev.layer !== "body" || ev.midi === undefined) continue;
      const key = Math.round(ev.beat! * 16) / 16;
      byBeat.set(key, (byBeat.get(key) ?? 0) + 1);
    }
    for (const count of byBeat.values()) {
      max = Math.max(max, count);
    }
  }
  return max;
}
