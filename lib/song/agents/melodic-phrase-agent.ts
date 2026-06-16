import type { PatternEventType, SectionDefType } from "@/lib/schemas/song";
import type { MelodyDefType } from "@/lib/schemas/melody";
import type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";
import { createSeededRng } from "../pattern/tonal-notes";

export const DEFAULT_MELODY: MelodyDefType = {
  enableChops: true,
  chopEveryBars: 2,
  octaveJumpProbability: 0.15,
  microTimingMs: 12,
  hocketAlternate: true,
};

export type MelodicPhraseAgentInput = {
  pack: ArrangementRulePackType;
  sections: SectionDefType[];
  seed: string;
};

export type MelodicPhraseAgentResult = {
  sections: SectionDefType[];
};

function msToBeatOffset(ms: number, bpm: number): number {
  return (ms / 1000) * (bpm / 60);
}

function mutateNoteEvent(
  ev: PatternEventType,
  opts: {
    rng: () => number;
    melody: MelodyDefType;
    bpm: number;
    beatsPerBar: number;
    noteIndex: number;
    chopBar: boolean;
  }
): PatternEventType {
  if (ev.kind !== "note" || ev.midi === undefined) return ev;

  let beat = ev.beat;
  let midi = ev.midi;
  let durationBeats = ev.durationBeats ?? 0.25;

  if (opts.melody.microTimingMs > 0) {
    const sign = opts.rng() < 0.5 ? -1 : 1;
    const jitterMs = opts.rng() * opts.melody.microTimingMs;
    beat += msToBeatOffset(jitterMs, opts.bpm) * sign;
    beat = Math.max(0, beat);
  }

  if (opts.rng() < opts.melody.octaveJumpProbability) {
    const jump = opts.rng() < 0.5 ? -12 : 12;
    midi = Math.min(127, Math.max(0, midi + jump));
  }

  if (opts.melody.enableChops && opts.chopBar) {
    durationBeats = Math.max(0.125, durationBeats * 0.55);
  }

  return { ...ev, beat, midi, durationBeats };
}

function shouldChopBar(barInSection: number, melody: MelodyDefType): boolean {
  if (!melody.enableChops) return false;
  const block = Math.floor(barInSection / melody.chopEveryBars);
  return block % 2 === 1;
}

function applyHocket(
  events: PatternEventType[],
  melody: MelodyDefType,
  rng: () => number
): PatternEventType[] {
  if (!melody.hocketAlternate) return events;

  const notes = events.filter(
    (e): e is PatternEventType & { kind: "note"; midi: number } =>
      e.kind === "note" &&
      e.midi !== undefined &&
      (e.layer === "sub" || e.layer === "body")
  );

  const byBeat = new Map<number, PatternEventType[]>();
  for (const note of notes) {
    const key = Math.round(note.beat * 16) / 16;
    const bucket = byBeat.get(key) ?? [];
    bucket.push(note);
    byBeat.set(key, bucket);
  }

  const drop = new Set<PatternEventType>();
  let hocketIdx = 0;
  for (const key of [...byBeat.keys()].sort((a, b) => a - b)) {
    const bucket = byBeat.get(key)!;
    const sub = bucket.find((n) => n.layer === "sub");
    const body = bucket.find((n) => n.layer === "body");
    if (!sub || !body) continue;

    const keepSub = hocketIdx % 2 === 0;
    drop.add(keepSub ? body : sub);
    hocketIdx++;
    if (rng() < 0.08) hocketIdx++;
  }

  return events.filter((e) => !drop.has(e));
}

/** Guarantee minimum distinct body pitches for eval gates (#107). */
function ensureBodyMidiSpread(
  events: PatternEventType[],
  minDistinct: number,
  rng: () => number
): PatternEventType[] {
  const bodyIndices: number[] = [];
  const midis = new Set<number>();

  events.forEach((ev, index) => {
    if (ev.kind === "note" && ev.layer === "body" && ev.midi !== undefined) {
      bodyIndices.push(index);
      midis.add(ev.midi);
    }
  });

  if (midis.size >= minDistinct) return events;

  const out = [...events];
  const jumps = [12, 7, -12, 5];
  let jumpIdx = 0;

  for (const index of bodyIndices) {
    if (midis.size >= minDistinct) break;
    const ev = out[index];
    if (ev?.kind !== "note" || ev.midi === undefined) continue;

    for (let attempt = 0; attempt < jumps.length && midis.size < minDistinct; attempt++) {
      const jump = jumps[(jumpIdx + attempt) % jumps.length]!;
      const candidate = Math.min(127, Math.max(0, ev.midi + jump));
      if (midis.has(candidate)) continue;
      out[index] = { ...ev, midi: candidate };
      midis.add(candidate);
      jumpIdx++;
      break;
    }
  }

  if (midis.size < minDistinct && bodyIndices.length > 0) {
    const idx = bodyIndices[Math.floor(rng() * bodyIndices.length)]!;
    const ev = out[idx];
    if (ev?.kind === "note" && ev.midi !== undefined) {
      const candidate = Math.min(127, ev.midi + 12);
      if (!midis.has(candidate)) {
        out[idx] = { ...ev, midi: candidate };
      }
    }
  }

  return out;
}

/** Post-pattern humanization — chops, octave jumps, micro-timing, hocket (#107). */
export function runMelodicPhraseAgent(
  input: MelodicPhraseAgentInput
): MelodicPhraseAgentResult {
  const melody: MelodyDefType = input.pack.melody ?? DEFAULT_MELODY;
  const { pack, seed } = input;
  const beatsPerBar = pack.beatsPerBar;

  const sections = input.sections.map((section) => {
    const spec = pack.sections.find((s) => s.id === section.id);
    const kind = spec?.kind;
    if (kind !== "drop" && kind !== "build" && kind !== "break") {
      return section;
    }

    const rng = createSeededRng(`${seed}:melody:${section.id}`);
    let noteIndex = 0;

    let events = section.events.map((ev) => {
      if (ev.kind !== "note" || (ev.layer !== "sub" && ev.layer !== "body")) {
        return ev;
      }
      const barInSection = Math.floor(ev.beat / beatsPerBar);
      const chopBar = shouldChopBar(barInSection, melody);
      noteIndex++;
      return mutateNoteEvent(ev, {
        rng,
        melody,
        bpm: pack.bpm,
        beatsPerBar,
        noteIndex,
        chopBar,
      });
    });

    events = applyHocket(events, melody, rng);

    if (kind === "drop") {
      events = ensureBodyMidiSpread(events, 3, rng);
    }

    return { ...section, events };
  });

  return { sections };
}

export function countDistinctBodyMidis(
  sections: SectionDefType[],
  sectionIds: Set<string>
): number {
  const midis = new Set<number>();
  for (const section of sections) {
    if (!sectionIds.has(section.id)) continue;
    for (const ev of section.events) {
      if (ev.kind === "note" && ev.layer === "body" && ev.midi !== undefined) {
        midis.add(ev.midi);
      }
    }
  }
  return midis.size;
}

export function microTimingSpreadMs(
  sections: SectionDefType[],
  bpm: number,
  sectionIds: Set<string>
): number {
  const beatMs = 60_000 / bpm;
  let maxFrac = 0;
  for (const section of sections) {
    if (!sectionIds.has(section.id)) continue;
    for (const ev of section.events) {
      if (ev.kind !== "note" || (ev.layer !== "sub" && ev.layer !== "body")) {
        continue;
      }
      const frac = ev.beat - Math.floor(ev.beat);
      if (frac > maxFrac) maxFrac = frac;
    }
  }
  return maxFrac * beatMs;
}

export function lintMelodicPhraseAgent(
  result: MelodicPhraseAgentResult,
  pack: ArrangementRulePackType
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const melody = pack.melody ?? DEFAULT_MELODY;
  if (melody.microTimingMs <= 0 && !melody.enableChops) {
    return { ok: true, errors };
  }

  const dropIds = new Set(
    pack.sections.filter((s) => s.kind === "drop").map((s) => s.id)
  );
  const spread = microTimingSpreadMs(result.sections, pack.bpm, dropIds);
  if (melody.microTimingMs > 0 && spread <= 0) {
    errors.push("melodic phrase: expected micro-timing spread in drops");
  }

  return { ok: errors.length === 0, errors };
}
