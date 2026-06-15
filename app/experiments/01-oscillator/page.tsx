"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import {
  AudioLabProvider,
  useAudioLab,
  useAnalyserNode,
  createOscillatorChain,
  updateOscillator,
  DEFAULT_OSCILLATOR,
  type OscillatorParams,
  type WaveformType,
} from "@/lib/audio";
import { FFTDisplay, Spectrograph } from "@/lib/viz";
import {
  ExperimentShell,
  ParamSlider,
  WaveformSelector,
} from "@/lib/ui";

function OscillatorExperiment() {
  const { isPlaying, ensureStarted, start, stop } = useAudioLab();
  const analyser = useAnalyserNode();
  const chainRef = useRef<ReturnType<typeof createOscillatorChain> | null>(null);
  const [params, setParams] = useState<OscillatorParams>(DEFAULT_OSCILLATOR);

  const togglePlay = useCallback(async () => {
    await ensureStarted();
    if (!chainRef.current && analyser) {
      chainRef.current = createOscillatorChain(analyser, params);
    }
    if (!chainRef.current) return;

    if (isPlaying) {
      chainRef.current.osc.stop();
      stop();
    } else {
      chainRef.current.osc.start();
      start();
    }
  }, [analyser, ensureStarted, isPlaying, params, start, stop]);

  useEffect(() => {
    if (chainRef.current) {
      updateOscillator(chainRef.current.osc, chainRef.current.gain, params);
    }
  }, [params]);

  useEffect(() => {
    return () => {
      chainRef.current?.osc.dispose();
      chainRef.current?.gain.dispose();
    };
  }, []);

  const patch = (partial: Partial<OscillatorParams>) =>
    setParams((p) => ({ ...p, ...partial }));

  return (
    <ExperimentShell
      title="Oscillator Basics"
      description="Generate raw tones and see their frequency content in real time."
      order={1}
      controls={
        <>
          <div className="space-y-6">
            <WaveformSelector
              value={params.waveform}
              onChange={(w: WaveformType) => patch({ waveform: w })}
            />
            <ParamSlider
              label="Frequency"
              value={params.frequency}
              min={40}
              max={2000}
              step={1}
              unit=" Hz"
              onChange={(frequency) => patch({ frequency })}
            />
            <ParamSlider
              label="Amplitude"
              value={params.amplitude}
              min={0}
              max={1}
              step={0.01}
              onChange={(amplitude) => patch({ amplitude })}
            />
            <button
              type="button"
              onClick={togglePlay}
              className={`w-full border px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                isPlaying
                  ? "border-hot text-hot hover:bg-hot/10"
                  : "border-cold text-cold hover:bg-cold/10"
              }`}
            >
              {isPlaying ? "Stop" : "Start"} oscillator
            </button>
          </div>
          <div className="space-y-2 font-mono text-xs text-secondary">
            <p>
              Select a waveform and sweep frequency. The FFT shows which
              harmonics are present; the spectrograph scrolls frequency over
              time.
            </p>
            <p className="text-tertiary">
              Saw and square are rich in harmonics — the foundation of RIDDIM
              bass design.
            </p>
          </div>
        </>
      }
    >
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          FFT — frequency content
        </h2>
        <FFTDisplay analyser={analyser} isActive={isPlaying} />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Spectrograph — frequency over time
        </h2>
        <Spectrograph analyser={analyser} isActive={isPlaying} />
      </div>
    </ExperimentShell>
  );
}

export default function OscillatorPage() {
  return (
    <AudioLabProvider>
      <OscillatorExperiment />
    </AudioLabProvider>
  );
}
