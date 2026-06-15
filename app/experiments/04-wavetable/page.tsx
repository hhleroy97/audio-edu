"use client";

import { ExperimentShell } from "@/lib/ui";

export default function WavetablePage() {
  return (
    <ExperimentShell
      title="Wavetable Modulation"
      description="Morph between stored waveforms to sculpt timbre beyond basic shapes."
      order={4}
    >
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Coming soon
        </p>
        <p className="mt-3 text-sm text-tertiary">
          Interactive wavetable morph controls and live FFT will land here. Complete{" "}
          <a href="/experiments/03-pitch-envelopes" className="text-cold hover:underline">
            Pitch Envelopes
          </a>{" "}
          first.
        </p>
      </div>
    </ExperimentShell>
  );
}
