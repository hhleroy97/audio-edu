import type { DrumHitType } from "@/lib/schemas/song";
import { RiddimPocketDef, type RiddimPocketDefType } from "@/lib/schemas/rhythm";
import type { RulePackSectionKindType } from "@/lib/schemas/section-kind";
import { createSeededRng } from "../pattern/tonal-notes";

export type PhraseSlotOverride = {
  barBVariant?: RiddimPocketDefType["barBVariant"];
  extraMidBarKick?: boolean;
  hatRoll?: boolean;
  ghostBeats?: number[];
};

/** Named 4-bar phrase slots — A/B/C/D variants (#111). */
export const PHRASE_SLOT_OVERRIDES: Record<string, PhraseSlotOverride> = {
  a: { barBVariant: "none" },
  b: { barBVariant: "extra-bounce", extraMidBarKick: true },
  c: { barBVariant: "hat-roll", hatRoll: true },
  d: { barBVariant: "extra-bounce", ghostBeats: [2, 3] },
  "extra-bounce": { barBVariant: "extra-bounce", extraMidBarKick: true },
  "hat-roll": { barBVariant: "hat-roll", hatRoll: true },
  ghost: { ghostBeats: [2, 3] },
  standard: { barBVariant: "none" },
};

export type RiddimPocketOptions = {
  bars: number;
  beatsPerBar?: number;
  includeSnare?: boolean;
  seed?: string;
  pocket?: Partial<RiddimPocketDefType>;
  kickVelocity?: number;
  snareVelocity?: number;
};

function swingSec(ms: number, beatInBar: number): number {
  if (ms <= 0) return 0;
  return beatInBar % 2 === 1 ? ms / 1000 : 0;
}

function jitterVelocity(base: number, rng: () => number, amount: number): number {
  const delta = (rng() * 2 - 1) * amount;
  return Math.max(0.05, Math.min(1, base + delta));
}

function buildBarPocket(
  bar: number,
  beatsPerBar: number,
  includeSnare: boolean,
  pocket: RiddimPocketDefType,
  slot: PhraseSlotOverride | undefined,
  rng: () => number,
  kickVelocity: number,
  snareVelocity: number
): DrumHitType[] {
  const hits: DrumHitType[] = [];
  const barStart = bar * beatsPerBar;
  const barBVariant = slot?.barBVariant ?? pocket.barBVariant;

  for (const beat of [0, 2]) {
    hits.push({
      beat: barStart + beat,
      sampleId: "kick",
      velocity: jitterVelocity(kickVelocity, rng, pocket.velocityJitter),
      microShiftSec: swingSec(pocket.swingMs, beat),
    });
  }

  if (pocket.bounceKick?.enabled) {
    const bounceVel = pocket.bounceKick.velocity;
    for (const beat of [1, 3]) {
      hits.push({
        beat: barStart + beat,
        sampleId: "kick",
        velocity: jitterVelocity(bounceVel, rng, pocket.velocityJitter * 0.5),
        microShiftSec: swingSec(pocket.swingMs, beat),
      });
    }
  }

  if (slot?.extraMidBarKick || barBVariant === "extra-bounce") {
    hits.push({
      beat: barStart + 2.5,
      sampleId: "kick",
      velocity: jitterVelocity(0.42, rng, pocket.velocityJitter),
      microShiftSec: swingSec(pocket.swingMs, 2),
    });
  }

  if (includeSnare) {
    const snareBeat = pocket.mainSnareBeat % beatsPerBar;
    hits.push({
      beat: barStart + snareBeat,
      sampleId: "snare",
      velocity: jitterVelocity(snareVelocity, rng, pocket.velocityJitter),
      microShiftSec: swingSec(pocket.swingMs, snareBeat),
    });
    hits.push({
      beat: barStart + snareBeat,
      sampleId: "clap",
      velocity: jitterVelocity(snareVelocity * 0.85, rng, pocket.velocityJitter),
      microShiftSec: swingSec(pocket.swingMs, snareBeat) + 0.002,
    });

    const ghostBeats = slot?.ghostBeats ?? pocket.ghostSnares?.beats ?? [];
    for (const ghostBeat of ghostBeats) {
      if (ghostBeat === snareBeat) continue;
      hits.push({
        beat: barStart + (ghostBeat % beatsPerBar),
        sampleId: "snare",
        velocity: jitterVelocity(
          pocket.ghostSnares?.velocity ?? 0.28,
          rng,
          pocket.velocityJitter
        ),
        microShiftSec: swingSec(pocket.swingMs, ghostBeat),
      });
    }
  }

  if (slot?.hatRoll || barBVariant === "hat-roll") {
    for (let i = 0; i < 4; i++) {
      hits.push({
        beat: barStart + beatsPerBar - 0.5 + i * 0.125,
        sampleId: "hat",
        velocity: 0.28 + i * 0.04,
      });
    }
  }

  return hits;
}

/** Halftime riddim pocket — main kicks, bounce kicks, snare stack, 2-bar A/B (#101). */
export function buildRiddimPocketGrid(options: RiddimPocketOptions): DrumHitType[] {
  const {
    bars,
    beatsPerBar = 4,
    includeSnare = true,
    seed = "pocket",
    kickVelocity = 0.88,
    snareVelocity = 0.62,
  } = options;

  const pocket: RiddimPocketDefType = RiddimPocketDef.parse(options.pocket ?? {});
  const rng = createSeededRng(`${seed}:pocket`);
  const phraseBars = Math.max(1, pocket.phraseBars);
  const hits: DrumHitType[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const phraseBar = bar % phraseBars;
    const isBarB = phraseBar === phraseBars - 1 && phraseBars > 1;
    const slot: PhraseSlotOverride | undefined = isBarB
      ? {
          barBVariant: pocket.barBVariant,
          extraMidBarKick: pocket.barBVariant === "extra-bounce",
          hatRoll: pocket.barBVariant === "hat-roll",
        }
      : { barBVariant: "none" };

    hits.push(
      ...buildBarPocket(
        bar,
        beatsPerBar,
        includeSnare,
        pocket,
        slot,
        rng,
        kickVelocity,
        snareVelocity
      )
    );
  }

  return hits.sort((a, b) => a.beat - b.beat);
}

export type RiddimPhraseGridOptions = RiddimPocketOptions & {
  slots: string[];
  phraseLengthBars?: number;
};

/** 4-bar phrase template grid — cycles slot ids A/B/C/D (#111). */
export function buildRiddimPhraseGrid(
  options: RiddimPhraseGridOptions
): DrumHitType[] {
  const {
    bars,
    beatsPerBar = 4,
    includeSnare = true,
    seed = "phrase",
    kickVelocity = 0.88,
    snareVelocity = 0.62,
    slots,
    phraseLengthBars = 4,
  } = options;

  const pocket: RiddimPocketDefType = RiddimPocketDef.parse(options.pocket ?? {});
  const rng = createSeededRng(`${seed}:phrase`);
  const hits: DrumHitType[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const slotId = slots[bar % phraseLengthBars] ?? slots[0] ?? "a";
    const slot = PHRASE_SLOT_OVERRIDES[slotId] ?? PHRASE_SLOT_OVERRIDES.a;
    hits.push(
      ...buildBarPocket(
        bar,
        beatsPerBar,
        includeSnare,
        pocket,
        slot,
        rng,
        kickVelocity,
        snareVelocity
      )
    );
  }

  return hits.sort((a, b) => a.beat - b.beat);
}

export function countPhraseVariationBars(
  hits: DrumHitType[],
  beatsPerBar: number,
  phraseLengthBars = 4
): number {
  const sigByPhraseBar = new Map<number, string>();

  for (let phraseBar = 0; phraseBar < phraseLengthBars; phraseBar++) {
    const tokens: string[] = [];
    for (const hit of hits) {
      const bar = Math.floor(hit.beat / beatsPerBar);
      if (bar % phraseLengthBars !== phraseBar) continue;
      const inBar = (hit.beat - bar * beatsPerBar).toFixed(2);
      tokens.push(`${hit.sampleId}@${inBar}`);
    }
    sigByPhraseBar.set(phraseBar, tokens.sort().join("|"));
  }

  return new Set(sigByPhraseBar.values()).size;
}

export function phraseSlotsForSection(
  templates: Partial<Record<RulePackSectionKindType, string[]>> | undefined,
  kind: RulePackSectionKindType
): string[] | undefined {
  return templates?.[kind];
}

export function countBounceKicks(hits: DrumHitType[]): number {
  let count = 0;
  for (const hit of hits) {
    if (hit.sampleId !== "kick") continue;
    const barBeat = ((hit.beat % 4) + 4) % 4;
    if (barBeat === 1 || barBeat === 3) count++;
  }
  return count;
}

export function drumVelocityStdDev(hits: DrumHitType[]): number {
  if (hits.length < 2) return 0;
  const vels = hits.map((h) => h.velocity ?? 0.8);
  const mean = vels.reduce((a, b) => a + b, 0) / vels.length;
  const variance =
    vels.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vels.length;
  return Math.sqrt(variance);
}
