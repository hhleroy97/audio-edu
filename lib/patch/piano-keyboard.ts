/** Base MIDI octave when `octaveOffset` is 0 (middle C = MIDI 60). */
export const PIANO_BASE_OCTAVE = 4;

export const PIANO_OCTAVE_DOWN = "z";
export const PIANO_OCTAVE_UP = "x";

export const PIANO_OCTAVE_MIN = -3;
export const PIANO_OCTAVE_MAX = 3;

/** Middle row — white keys (semitone offset from C within the octave). */
export const PIANO_WHITE_KEYS: Record<string, number> = {
  a: 0,
  s: 2,
  d: 4,
  f: 5,
  g: 7,
  h: 9,
  j: 11,
  k: 12,
};

/** Top row — black keys (gaps on r, i, o, p, etc.). */
export const PIANO_BLACK_KEYS: Record<string, number> = {
  w: 1,
  e: 3,
  t: 6,
  y: 8,
  u: 10,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function isPianoNoteKey(key: string): boolean {
  const k = key.toLowerCase();
  return k in PIANO_WHITE_KEYS || k in PIANO_BLACK_KEYS;
}

export function isPianoOctaveKey(key: string): boolean {
  const k = key.toLowerCase();
  return k === PIANO_OCTAVE_DOWN || k === PIANO_OCTAVE_UP;
}

export function semitoneOffsetForKey(key: string): number | null {
  const k = key.toLowerCase();
  if (k in PIANO_WHITE_KEYS) return PIANO_WHITE_KEYS[k];
  if (k in PIANO_BLACK_KEYS) return PIANO_BLACK_KEYS[k];
  return null;
}

export function midiNoteNumber(semitoneOffset: number, octaveOffset = 0): number {
  return 12 * (PIANO_BASE_OCTAVE + 1) + semitoneOffset + octaveOffset * 12;
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function frequencyForKey(key: string, octaveOffset = 0): number | null {
  const offset = semitoneOffsetForKey(key);
  if (offset === null) return null;
  return midiToFrequency(midiNoteNumber(offset, octaveOffset));
}

export function noteLabelForFrequency(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

export function clampOctaveOffset(offset: number): number {
  return Math.min(PIANO_OCTAVE_MAX, Math.max(PIANO_OCTAVE_MIN, offset));
}

export function displayOctave(octaveOffset: number): number {
  return PIANO_BASE_OCTAVE + octaveOffset;
}
