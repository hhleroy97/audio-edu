import type { DrumHitType } from "@/lib/schemas/song";
import { RiddimPocketDef, type RiddimPocketDefType } from "@/lib/schemas/rhythm";
import { createSeededRng } from "../pattern/tonal-notes";

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
  const hits: DrumHitType[] = [];
  const phraseBars = Math.max(1, pocket.phraseBars);

  for (let bar = 0; bar < bars; bar++) {
    const phraseBar = bar % phraseBars;
    const isBarB = phraseBar === phraseBars - 1 && phraseBars > 1;
    const barStart = bar * beatsPerBar;

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

    if (isBarB && pocket.barBVariant === "extra-bounce") {
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

      for (const ghostBeat of pocket.ghostSnares?.beats ?? []) {
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

    if (isBarB && pocket.barBVariant === "hat-roll") {
      for (let i = 0; i < 4; i++) {
        hits.push({
          beat: barStart + beatsPerBar - 0.5 + i * 0.125,
          sampleId: "hat",
          velocity: 0.28 + i * 0.04,
        });
      }
    }
  }

  return hits.sort((a, b) => a.beat - b.beat);
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
