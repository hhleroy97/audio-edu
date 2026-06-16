import { describe, expect, it } from "vitest";
import {
  clampOctaveOffset,
  displayOctave,
  frequencyForKey,
  isPianoNoteKey,
  midiToFrequency,
  noteLabelForFrequency,
  PIANO_OCTAVE_MAX,
  PIANO_OCTAVE_MIN,
  semitoneOffsetForKey,
} from "@/lib/patch/piano-keyboard";

describe("piano keyboard mapping", () => {
  it("maps middle-row white keys", () => {
    expect(semitoneOffsetForKey("a")).toBe(0);
    expect(semitoneOffsetForKey("s")).toBe(2);
    expect(semitoneOffsetForKey("k")).toBe(12);
  });

  it("maps top-row black keys with gaps", () => {
    expect(semitoneOffsetForKey("w")).toBe(1);
    expect(semitoneOffsetForKey("e")).toBe(3);
    expect(semitoneOffsetForKey("t")).toBe(6);
    expect(semitoneOffsetForKey("r")).toBeNull();
  });

  it("returns C4 for A at base octave", () => {
    expect(frequencyForKey("a", 0)).toBeCloseTo(midiToFrequency(60), 2);
    expect(noteLabelForFrequency(frequencyForKey("a", 0)!)).toBe("C4");
  });

  it("shifts octave with offset", () => {
    expect(frequencyForKey("a", 1)).toBeCloseTo(midiToFrequency(72), 2);
    expect(displayOctave(1)).toBe(5);
  });

  it("clamps octave offset", () => {
    expect(clampOctaveOffset(PIANO_OCTAVE_MIN - 1)).toBe(PIANO_OCTAVE_MIN);
    expect(clampOctaveOffset(PIANO_OCTAVE_MAX + 1)).toBe(PIANO_OCTAVE_MAX);
  });

  it("recognizes note keys only", () => {
    expect(isPianoNoteKey("a")).toBe(true);
    expect(isPianoNoteKey("w")).toBe(true);
    expect(isPianoNoteKey("z")).toBe(false);
  });
});
