"use client";

import { ExperimentShell } from "@/lib/ui";

export default function PitchEnvelopesPage() {
  return (
    <ExperimentShell
      title="Pitch Envelopes"
      description="Shape pitch over time with ADSR-style envelopes for plucks, sweeps, and bass drops."
      order={3}
    >
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Coming soon
        </p>
        <p className="mt-3 text-sm text-tertiary">
          Interactive pitch envelope controls and live FFT will land here. Complete{" "}
          <a href="/experiments/02-unison" className="text-cold hover:underline">
            Unison & Detuning
          </a>{" "}
          first.
        </p>
      </div>
    </ExperimentShell>
  );
}
