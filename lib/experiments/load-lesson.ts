import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { extractFrontmatter } from "@/graph/extract/deterministic";
import { ExperimentFrontmatter } from "@/lib/schemas/frontmatter";

export type ExperimentLessonData = {
  slug: string;
  title: string;
  description: string;
  order: number;
  learningObjectives: string[];
  estimatedMinutes: number;
  theoryExcerpt: string;
};

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function extractTheoryExcerpt(markdown: string): string {
  const body = markdown.replace(/^---[\s\S]*?---\s*\n/, "");
  const paragraphs = body
    .split("\n\n")
    .map((p) => p.trim())
    .filter(
      (p) =>
        p &&
        !p.startsWith("#") &&
        !p.startsWith("-") &&
        !p.startsWith("See [[") &&
        !p.startsWith("[")
    );
  return paragraphs.slice(0, 2).join("\n\n");
}

export function loadExperimentLesson(slug: string): ExperimentLessonData | null {
  const expDir = join(process.cwd(), "app/experiments", slug);
  const mdPath = join(expDir, "experiment.md");
  if (!existsSync(mdPath)) return null;

  const raw = readFileSync(mdPath, "utf-8");
  const fm = extractFrontmatter(raw);
  const parsed = ExperimentFrontmatter.parse({
    ...fm,
    order: Number(fm.order),
    difficulty: Number(fm.difficulty),
    estimatedMinutes: Number(fm.estimatedMinutes),
    learningObjectives: coerceStringArray(fm.learningObjectives),
    prerequisites: coerceStringArray(fm.prerequisites),
    concepts: coerceStringArray(fm.concepts),
    summary:
      typeof fm.summary === "string"
        ? fm.summary
        : Array.isArray(fm.summary)
          ? (fm.summary as string[]).join(" ")
          : undefined,
  });

  return {
    slug,
    title: parsed.title,
    description: parsed.description,
    order: parsed.order,
    learningObjectives: parsed.learningObjectives,
    estimatedMinutes: parsed.estimatedMinutes,
    theoryExcerpt: extractTheoryExcerpt(raw),
  };
}
