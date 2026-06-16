import type { Lesson } from "@/lib/schemas/patch";
import { lesson01Oscillator } from "./lesson-01-oscillator";
import { lesson02Unison } from "./lesson-02-unison";
import { lesson03Envelope } from "./lesson-03-envelope";
import { lesson07ModMatrix } from "./lesson-07-mod-matrix";
import { lesson08Patterns } from "./lesson-08-patterns";
import { lesson09Multibus } from "./lesson-09-multibus";
import { lesson10Arrangement } from "./lesson-10-arrangement";

export const LESSONS: Lesson[] = [
  lesson01Oscillator,
  lesson02Unison,
  lesson03Envelope,
  lesson07ModMatrix,
  lesson08Patterns,
  lesson09Multibus,
  lesson10Arrangement,
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function getNextLesson(slug: string): Lesson | null {
  const idx = LESSONS.findIndex((l) => l.slug === slug);
  if (idx < 0 || idx >= LESSONS.length - 1) return null;
  return LESSONS[idx + 1] ?? null;
}
