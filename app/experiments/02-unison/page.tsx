"use client";

import { ExperimentShell } from "@/lib/ui";

export default function UnisonPage() {
  return (
    <ExperimentShell
      title="Unison & Detuning"
      description="Stack detuned voices for width, thickness, and stereo spread."
      order={2}
    >
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Coming soon
        </p>
        <p className="mt-3 text-sm text-tertiary">
          Interactive unison controls and live FFT will land here. Complete{" "}
          <a href="/experiments/01-oscillator" className="text-cold hover:underline">
            Oscillator Basics
          </a>{" "}
          first.
        </p>
      </div>
    </ExperimentShell>
  );
}
