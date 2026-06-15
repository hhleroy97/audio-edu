import Link from "next/link";
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { extractFrontmatter } from "@/graph/extract/deterministic";

const EXPERIMENTS_DIR = join(process.cwd(), "app/experiments");

function loadExperiments() {
  if (!existsSync(EXPERIMENTS_DIR)) return [];

  return readdirSync(EXPERIMENTS_DIR)
    .filter((name) => statSync(join(EXPERIMENTS_DIR, name)).isDirectory())
    .map((slug) => {
      const md = readFileSync(
        join(EXPERIMENTS_DIR, slug, "experiment.md"),
        "utf-8"
      );
      const fm = extractFrontmatter(md);
      return {
        slug,
        title: String(fm.title ?? slug),
        description: String(fm.description ?? ""),
        order: Number(fm.order ?? 99),
        difficulty: Number(fm.difficulty ?? 1),
        estimatedMinutes: Number(fm.estimatedMinutes ?? 0),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export default function HomePage() {
  const experiments = loadExperiments();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-16 border-b border-border pb-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-secondary">
          Synthesis Learning Lab
        </p>
        <h1 className="text-3xl font-medium tracking-tight">
          Make invisible systems visible.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-secondary">
          A RIDDIM-focused sound-design arc. Patch nodes on the canvas in the{" "}
          <Link href="/lab" className="text-cold hover:underline">
            Patch Lab
          </Link>
          , or explore legacy experiment pages below.
        </p>
      </header>

      <ol className="space-y-4">
        {experiments.map((exp) => (
          <li key={exp.slug}>
            <Link
              href={`/experiments/${exp.slug}`}
              className="group block border border-border p-5 transition-colors hover:border-cold/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-secondary">
                    {String(exp.order).padStart(2, "0")} · {exp.estimatedMinutes}
                    min · diff {exp.difficulty}
                  </p>
                  <h2 className="mt-1 text-lg text-primary group-hover:text-cold">
                    {exp.title}
                  </h2>
                  <p className="mt-1 text-sm text-secondary">{exp.description}</p>
                </div>
                <span className="font-mono text-cold opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      <footer className="mt-16 border-t border-border pt-8 font-mono text-xs text-secondary">
        <Link href="/lab" className="mr-6 hover:text-cold">
          Patch Lab →
        </Link>
        <Link href="/graph" className="hover:text-cold">
          Knowledge graph →
        </Link>
      </footer>
    </main>
  );
}
