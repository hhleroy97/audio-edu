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
    expect(getNextLesson("03-envelope")?.slug).toBe("07-mod-matrix");
    expect(getNextLesson("07-mod-matrix")?.slug).toBe("08-patterns");
    expect(getNextLesson("08-patterns")?.slug).toBe("09-multibus");
    expect(getNextLesson("09-multibus")?.slug).toBe("10-arrangement-agents");
    expect(getNextLesson("10-arrangement-agents")).toBeNull();
    expect(getNextLesson("unknown")).toBeNull();
  });

  it("validates lesson 08 patterns schema", () => {
    const lesson = getLessonBySlug("08-patterns");
    expect(lesson?.title).toMatch(/patterns/i);
    expect(lesson?.pages.length).toBeGreaterThanOrEqual(1);
  });
});
