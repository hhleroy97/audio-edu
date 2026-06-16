import { describe, expect, it } from "vitest";
import {
  LESSONS,
  getLessonBySlug,
  getNextLesson,
} from "@/lib/patch/lessons/index";

describe("patch lesson registry", () => {
  it("lists lessons in order", () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(3);
    expect(LESSONS[2]?.slug).toBe("03-envelope");
  });

  it("resolves lessons by slug", () => {
    expect(getLessonBySlug("01-oscillator")?.title).toMatch(/oscillator/i);
    expect(getLessonBySlug("03-envelope")?.title).toMatch(/envelope/i);
    expect(getLessonBySlug("missing")).toBeUndefined();
  });

  it("returns the next lesson in sequence", () => {
    expect(getNextLesson("01-oscillator")?.slug).toBe("02-unison");
    expect(getNextLesson("02-unison")?.slug).toBe("03-envelope");
    expect(getNextLesson("03-envelope")).toBeNull();
    expect(getNextLesson("unknown")).toBeNull();
  });
});
