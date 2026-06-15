"use client";

import { ExperimentShell } from "@/lib/ui";

export default function FilteringPage() {
  return (
    <ExperimentShell
      title="Filtering"
      description="Sculpt timbre with cutoff and resonance — the core of subtractive synthesis."
      order={5}
    >
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Coming soon
        </p>
        <p className="mt-3 text-sm text-tertiary">
          Interactive filter controls and live FFT will land here. Complete{" "}
          <a href="/experiments/04-wavetable" className="text-cold hover:underline">
            Wavetable Modulation
          </a>{" "}
          first.
        </p>
      </div>
    </ExperimentShell>
  );
}
