"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type MicroLessonProps = {
  objectives: string[];
  excerpt: string;
  estimatedMinutes: number;
  className?: string;
};

export function MicroLesson({
  objectives,
  excerpt,
  estimatedMinutes,
  className,
}: MicroLessonProps) {
  const [open, setOpen] = useState(true);

  return (
    <section
      className={cn("mb-8 border border-border", className)}
      aria-label="Micro-lesson"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-mono text-xs uppercase tracking-widest text-cold hover:bg-surface"
      >
        <span>Micro-lesson · {estimatedMinutes} min</span>
        <span className="text-secondary">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
              You will
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-primary">
              {objectives.map((obj) => (
                <li key={obj}>{obj}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-secondary">{excerpt}</p>
          <p className="font-mono text-xs uppercase tracking-widest text-cold">
            ↓ Playground below
          </p>
        </div>
      )}
    </section>
  );
}
