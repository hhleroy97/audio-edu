import Link from "next/link";
import { cn } from "@/lib/utils";
import { MicroLesson, type MicroLessonProps } from "./MicroLesson";

type ExperimentShellProps = {
  title: string;
  description: string;
  order: number;
  children: React.ReactNode;
  controls?: React.ReactNode;
  lesson?: MicroLessonProps;
  className?: string;
};

export function ExperimentShell({
  title,
  description,
  order,
  children,
  controls,
  lesson,
  className,
}: ExperimentShellProps) {
  return (
    <div className={cn("mx-auto max-w-4xl px-6 py-10", className)}>
      <header className="mb-10 border-b border-border pb-6">
        <Link
          href="/"
          className="mb-4 inline-block font-mono text-xs uppercase tracking-widest text-secondary hover:text-cold"
        >
          ← Lab
        </Link>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Experiment {String(order).padStart(2, "0")}
        </p>
        <h1 className="text-2xl font-medium tracking-tight text-primary">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">{description}</p>
      </header>

      {lesson && (
        <MicroLesson
          objectives={lesson.objectives}
          excerpt={lesson.excerpt}
          estimatedMinutes={lesson.estimatedMinutes}
        />
      )}

      {controls && (
        <section className="mb-8 grid gap-6 border border-border p-6 md:grid-cols-2">
          {controls}
        </section>
      )}

      <section className="grid gap-6">{children}</section>
    </div>
  );
}
