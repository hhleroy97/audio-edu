"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLabProvider,
  useAudioLab,
  useAnalyserNode,
  useWaveformAnalyser,
  createUnisonChain,
  updateUnisonChain,
  startUnison,
  stopUnison,
  disposeUnison,
  DEFAULT_UNISON,
  type UnisonParams,
  type UnisonChain,
  type WaveformType,
} from "@/lib/audio";
import { FFTDisplay, Spectrograph, WaveformOverlay } from "@/lib/viz";
import {
  ExperimentShell,
  ParamSlider,
  WaveformSelector,
} from "@/lib/ui";

function UnisonExperiment() {
  const { isPlaying, ensureStarted, start, stop } = useAudioLab();
  const fftAnalyser = useAnalyserNode();
  const waveformAnalyser = useWaveformAnalyser();
  const chainRef = useRef<UnisonChain | null>(null);
  const [params, setParams] = useState<UnisonParams>(DEFAULT_UNISON);

  const rebuildIfNeeded = useCallback(async () => {
    await ensureStarted();
    if (!fftAnalyser) return;

    if (!chainRef.current) {
      chainRef.current = createUnisonChain(
        fftAnalyser,
        waveformAnalyser,
        params
      );
    } else {
      updateUnisonChain(chainRef.current, params);
    }
  }, [ensureStarted, fftAnalyser, waveformAnalyser, params]);

  useEffect(() => {
    void rebuildIfNeeded();
  }, [rebuildIfNeeded]);

  const togglePlay = useCallback(async () => {
    await rebuildIfNeeded();
    if (!chainRef.current) return;

    if (isPlaying) {
      stopUnison(chainRef.current);
      stop();
    } else {
      startUnison(chainRef.current);
      start();
    }
  }, [isPlaying, rebuildIfNeeded, start, stop]);

  useEffect(() => {
    return () => {
      if (chainRef.current) disposeUnison(chainRef.current);
    };
  }, []);

  const patch = (partial: Partial<UnisonParams>) =>
    setParams((p) => ({ ...p, ...partial }));

  return (
    <ExperimentShell
      title="Unison & Detuning"
      description="Stack detuned voices for width, thickness, and stereo spread."
      order={2}
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
              max={800}
              step={1}
              unit=" Hz"
              onChange={(frequency) => patch({ frequency })}
            />
            <ParamSlider
              label="Voices"
              value={params.voiceCount}
              min={1}
              max={8}
              step={1}
              onChange={(voiceCount) =>
                patch({ voiceCount: Math.round(voiceCount) })
              }
            />
            <ParamSlider
              label="Detune"
              value={params.detune}
              min={0}
              max={50}
              step={0.5}
              unit=" ct"
              onChange={(detune) => patch({ detune })}
            />
            <ParamSlider
              label="Spread"
              value={params.spread}
              min={0}
              max={1}
              step={0.01}
              onChange={(spread) => patch({ spread })}
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
              {isPlaying ? "Stop" : "Start"} unison
            </button>
          </div>
          <div className="space-y-2 font-mono text-xs text-secondary">
            <p>
              Multiple detuned voices smear the spectrum and create beating.
              Increase spread to hear voices pan across the stereo field.
            </p>
            <p className="text-tertiary">
              Layered on experiment 01 controls — FFT and spectrograph stay on.
            </p>
          </div>
        </>
      }
    >
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Waveform overlay
        </h2>
        <WaveformOverlay
          analyser={waveformAnalyser}
          isActive={isPlaying}
        />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          FFT — detuned partial smearing
        </h2>
        <FFTDisplay analyser={fftAnalyser} isActive={isPlaying} />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Spectrograph — beating over time
        </h2>
        <Spectrograph analyser={fftAnalyser} isActive={isPlaying} />
      </div>
    </ExperimentShell>
  );
}

export default function UnisonPage() {
  return (
    <AudioLabProvider>
      <UnisonExperiment />
    </AudioLabProvider>
  );
}
