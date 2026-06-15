"use client";

import type { Lesson, TourStep } from "@/lib/schemas/patch";
import { LessonDiagram } from "@/lib/viz/LessonDiagram";

type LessonPanelProps = {
  lesson: Lesson;
  steps: TourStep[];
  stepIndex: number;
  isLastStep: boolean;
  onContinue: () => void;
  onDismiss: () => void;
  onDemo: () => void;
};

const KIND_LABELS: Record<TourStep["kind"], string> = {
  explain: "Concept",
  demo: "Listen",
  do: "Try it",
  reflect: "Recap",
};

export function LessonPanel({
  lesson,
  steps,
  stepIndex,
  isLastStep,
  onContinue,
  onDismiss,
  onDemo,
}: LessonPanelProps) {
  const step = steps[stepIndex];
  const pageTitle =
    lesson.pages.find((p) =>
      p.steps.some((s) => s.id === step.id)
    )?.title ?? lesson.title;

  return (
    <aside
      className="flex w-96 shrink-0 flex-col border-r border-border bg-surface"
      role="complementary"
      aria-label="Lesson guide"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary">
          Lesson
        </p>
        <h2 className="mt-1 text-sm font-medium leading-snug">{lesson.title}</h2>
        <p className="mt-1 font-mono text-[10px] text-cold">{pageTitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-cold">
            {KIND_LABELS[step.kind]}
          </p>
          <p className="font-mono text-[10px] text-secondary">
            {stepIndex + 1} / {steps.length}
          </p>
        </div>

        <div className="mb-1 h-1 w-full bg-border">
          <div
            className="h-full bg-cold transition-all"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {step.diagram && (
          <LessonDiagram
            diagram={step.diagram}
            className="mt-4 border border-border"
          />
        )}

        <p className="mt-4 text-sm font-medium leading-relaxed text-primary">
          {step.content}
        </p>

        {step.detail && (
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            {step.detail}
          </p>
        )}

        <ol className="mt-6 space-y-2 border-t border-border pt-4">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={
                i === stepIndex
                  ? "font-mono text-[10px] text-cold"
                  : i < stepIndex
                    ? "font-mono text-[10px] text-secondary/60 line-through"
                    : "font-mono text-[10px] text-secondary/40"
              }
            >
              {i + 1}. {s.content.slice(0, 48)}
              {s.content.length > 48 ? "…" : ""}
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-border px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {step.kind === "demo" && (
            <button
              type="button"
              onClick={onDemo}
              className="border border-cold px-3 py-2 font-mono text-xs uppercase text-cold hover:bg-cold/10"
            >
              Hear demo
            </button>
          )}
          {step.kind === "do" && (
            <p className="font-mono text-[10px] leading-relaxed text-secondary">
              Complete the action on the canvas to continue…
            </p>
          )}
          {step.kind !== "do" && step.kind !== "demo" && (
            <button
              type="button"
              onClick={onContinue}
              className="border border-cold px-3 py-2 font-mono text-xs uppercase text-cold hover:bg-cold/10"
            >
              {isLastStep ? "Enter playground" : "Continue"}
            </button>
          )}
          {!isLastStep && step.kind !== "do" && (
            <button
              type="button"
              onClick={onDismiss}
              className="border border-border px-3 py-2 font-mono text-xs uppercase text-secondary hover:border-cold hover:text-cold"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
