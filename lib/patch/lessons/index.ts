import type { Lesson } from "@/lib/schemas/patch";
import { lesson01Oscillator } from "./lesson-01-oscillator";
import { lesson02Unison } from "./lesson-02-unison";
import { lesson03Envelope } from "./lesson-03-envelope";

export const LESSONS: Lesson[] = [
  lesson01Oscillator,
  lesson02Unison,
  lesson03Envelope,
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function getNextLesson(slug: string): Lesson | null {
  const idx = LESSONS.findIndex((l) => l.slug === slug);
  if (idx < 0 || idx >= LESSONS.length - 1) return null;
  return LESSONS[idx + 1] ?? null;
}
