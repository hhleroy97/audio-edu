"use client";

import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { Lesson, TourStep } from "@/lib/schemas/patch";
import { LessonDiagram } from "@/lib/viz/LessonDiagram";

export type LessonPanelView =
  | "step"
  | "completion-choice"
  | "playground-recap"
  | "next-lesson-preview";

type LessonPanelProps = {
  lesson: Lesson;
  steps: TourStep[];
  stepIndex: number;
  view: LessonPanelView;
  nextLessonTitle: string | null;
  isLastStep: boolean;
  onContinue: () => void;
  onDismiss: () => void;
  onDemo: () => void;
  onChoosePlayground: () => void;
  onChooseNextLesson: () => void;
  onCollapse: () => void;
  onStartNextFromRecap: () => void;
};

const KIND_LABELS: Record<TourStep["kind"], string> = {
  explain: "Concept",
  demo: "Listen",
  do: "Try it",
  reflect: "Recap",
};

export function LessonPanelCollapsed({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-col items-center gap-2 px-1 py-2 text-secondary transition-colors hover:text-cold"
        aria-label="Expand lesson panel"
        title="Lesson guide"
      >
        <Info className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span
          className="font-mono text-[9px] uppercase tracking-widest [writing-mode:vertical-rl]"
          style={{ writingMode: "vertical-rl" }}
        >
          Lesson
        </span>
      </button>
    </div>
  );
}

export function LessonPanel({
  lesson,
  steps,
  stepIndex,
  view,
  nextLessonTitle,
  isLastStep,
  onContinue,
  onDismiss,
  onDemo,
  onChoosePlayground,
  onChooseNextLesson,
  onCollapse,
  onStartNextFromRecap,
}: LessonPanelProps) {
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const pageTitle =
    lesson.pages.find((p) => p.steps.some((s) => s.id === step.id))?.title ??
    lesson.title;

  return (
    <aside
      className="flex w-96 shrink-0 flex-col border-r border-border bg-surface"
      role="complementary"
      aria-label="Lesson guide"
    >
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary">
            Lesson
          </p>
          <h2 className="mt-1 text-sm font-medium leading-snug">{lesson.title}</h2>
          {view === "step" && (
            <p className="mt-1 font-mono text-[10px] text-cold">{pageTitle}</p>
          )}
          {view === "playground-recap" && (
            <p className="mt-1 font-mono text-[10px] text-cold">Playground</p>
          )}
          {view === "next-lesson-preview" && nextLessonTitle && (
            <p className="mt-1 font-mono text-[10px] text-cold">Up next</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="shrink-0 border border-border p-1.5 text-secondary hover:border-cold hover:text-cold"
          aria-label="Collapse lesson panel"
          title="Collapse"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {view === "completion-choice" && (
          <CompletionChoice
            lessonTitle={lesson.title}
            nextLessonTitle={nextLessonTitle}
            onChoosePlayground={onChoosePlayground}
            onChooseNextLesson={onChooseNextLesson}
          />
        )}

        {view === "playground-recap" && (
          <PlaygroundRecap
            lesson={lesson}
            steps={steps}
            nextLessonTitle={nextLessonTitle}
            onStartNext={onStartNextFromRecap}
          />
        )}

        {view === "next-lesson-preview" && nextLessonTitle && (
          <div>
            <LessonDiagram
              diagram="lesson-complete"
              className="border border-border"
            />
            <p className="mt-4 text-sm font-medium text-primary">
              Starting: {nextLessonTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              The next lesson builds on your current patch. The panel stays open
              as you work through new steps.
            </p>
          </div>
        )}

        {view === "step" && (
          <>
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
                style={{
                  width: `${((stepIndex + 1) / steps.length) * 100}%`,
                }}
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
          </>
        )}
      </div>

      {view === "step" && (
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
                {isLastStep ? "Finish lesson" : "Continue"}
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
      )}
    </aside>
  );
}

function CompletionChoice({
  lessonTitle,
  nextLessonTitle,
  onChoosePlayground,
  onChooseNextLesson,
}: {
  lessonTitle: string;
  nextLessonTitle: string | null;
  onChoosePlayground: () => void;
  onChooseNextLesson: () => void;
}) {
  return (
    <div>
      <LessonDiagram diagram="lesson-complete" className="border border-border" />
      <p className="mt-4 text-sm font-medium text-primary">
        You finished {lessonTitle}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-secondary">
        What would you like to do next?
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={onChoosePlayground}
          className="border border-border px-4 py-3 text-left transition-colors hover:border-cold"
        >
          <p className="font-mono text-xs uppercase text-cold">Stay in playground</p>
          <p className="mt-1 text-sm text-secondary">
            Free-patch with the nodes you unlocked. The lesson panel will collapse
            — reopen it anytime with the chevron.
          </p>
        </button>
        {nextLessonTitle ? (
          <button
            type="button"
            onClick={onChooseNextLesson}
            className="border border-cold/60 px-4 py-3 text-left transition-colors hover:border-cold hover:bg-cold/5"
          >
            <p className="font-mono text-xs uppercase text-cold">
              Continue to next lesson
            </p>
            <p className="mt-1 text-sm text-secondary">
              Start <span className="text-primary">{nextLessonTitle}</span> — the
              guide stays open.
            </p>
          </button>
        ) : (
          <p className="font-mono text-[10px] text-secondary">
            More lessons coming soon — explore the playground for now.
          </p>
        )}
      </div>
    </div>
  );
}

function PlaygroundRecap({
  lesson,
  steps,
  nextLessonTitle,
  onStartNext,
}: {
  lesson: Lesson;
  steps: TourStep[];
  nextLessonTitle: string | null;
  onStartNext: () => void;
}) {
  const lastStep = steps[steps.length - 1];
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-cold">
        Completed
      </p>
      <p className="mt-2 text-sm font-medium text-primary">{lesson.title}</p>
      <p className="mt-3 text-sm leading-relaxed text-secondary">
        {lastStep?.content ?? "Lesson complete."}
      </p>
      {lastStep?.detail && (
        <p className="mt-2 text-sm leading-relaxed text-secondary/80">
          {lastStep.detail}
        </p>
      )}
      {nextLessonTitle && (
        <button
          type="button"
          onClick={onStartNext}
          className="mt-6 w-full border border-cold px-3 py-2 font-mono text-xs uppercase text-cold hover:bg-cold/10"
        >
          Start {nextLessonTitle}
        </button>
      )}
    </div>
  );
}
