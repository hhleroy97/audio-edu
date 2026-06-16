import { Note, Scale } from "tonal";

/** Deterministic PRNG from string seed. */
export function createSeededRng(seed: string): () => number {
  let state = 5381;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 33) ^ seed.charCodeAt(i);
  }
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/** Resolve scale notes for key + scale name via tonal. */
export function scaleNotesForKey(key: string, scaleName: string): string[] {
  const id = `${key} ${scaleName}`;
  const scale = Scale.get(id);
  if (scale.notes.length > 0) return scale.notes;
  const fallback = Scale.get(`${key} minor`);
  return fallback.notes.length > 0 ? fallback.notes : ["F#", "A", "B", "C#", "E"];
}

/** Scale degree (1-indexed) → MIDI note number at octave. */
export function midiFromScaleDegree(
  key: string,
  scaleName: string,
  degree: number,
  octave: number
): number {
  const notes = scaleNotesForKey(key, scaleName);
  const idx = ((degree - 1) % notes.length + notes.length) % notes.length;
  const name = notes[idx];
  if (!name) return 42;
  const midi = Note.midi(`${name}${octave}`);
  return midi ?? 42;
}

/** Pick degree from pool using seeded rng. */
export function pickDegree(
  pool: number[],
  rng: () => number,
  hitIndex: number
): number {
  if (pool.length === 0) return 1;
  const idx = Math.floor(rng() * pool.length + hitIndex * 0.0001) % pool.length;
  return pool[idx] ?? 1;
}
