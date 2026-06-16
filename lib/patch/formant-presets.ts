export type VowelId = "a" | "e" | "o" | "i";

export type FormantPreset = {
  id: VowelId;
  label: string;
  /** F1, F2, F3 center frequencies (Hz) — CCRMA / Klatt approximations */
  freqs: [number, number, number];
};

/** Sourced from CCRMA formant example + speech synthesis literature. */
export const FORMANT_VOWELS: FormantPreset[] = [
  { id: "a", label: "AH", freqs: [700, 1220, 2600] },
  { id: "e", label: "EH", freqs: [400, 2000, 2800] },
  { id: "o", label: "OH", freqs: [450, 800, 2800] },
  { id: "i", label: "EE", freqs: [300, 2200, 3000] },
];

export function getFormantVowel(id: string): FormantPreset {
  return FORMANT_VOWELS.find((v) => v.id === id) ?? FORMANT_VOWELS[0];
}
