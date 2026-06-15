"use client";

import { ExperimentShell } from "@/lib/ui";

export default function LayeringPage() {
  return (
    <ExperimentShell
      title="Layering"
      description="Combine multiple oscillators with independent timbres into a single cohesive patch."
      order={6}
    >
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Coming soon
        </p>
        <p className="mt-3 text-sm text-tertiary">
          Interactive multi-oscillator layering controls and live FFT will land here. Complete{" "}
          <a href="/experiments/05-filtering" className="text-cold hover:underline">
            Filtering
          </a>{" "}
          first.
        </p>
      </div>
    </ExperimentShell>
  );
}
