"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLabProvider,
  useAudioLab,
  useAnalyserNode,
  useWaveformAnalyser,
  createLayerMixerChain,
  startLayerMixer,
  stopLayerMixer,
  disposeLayerMixerChain,
  DEFAULT_LAYERS,
  type SynthLayer,
  type LayerMixerChain,
} from "@/lib/audio";
import { FFTDisplay, Spectrograph, WaveformOverlay } from "@/lib/viz";
import { ExperimentShell, LayerPanel } from "@/lib/ui";
import type { ExperimentLessonData } from "@/lib/experiments/load-lesson";

function LayeringInner({ lesson }: { lesson: ExperimentLessonData }) {
  const { isPlaying, ensureStarted, start, stop } = useAudioLab();
  const fftAnalyser = useAnalyserNode();
  const waveformAnalyser = useWaveformAnalyser();
  const chainRef = useRef<LayerMixerChain | null>(null);
  const [layers, setLayers] = useState<SynthLayer[]>(DEFAULT_LAYERS);

  const rebuild = useCallback(async () => {
    await ensureStarted();
    if (!fftAnalyser) return;
    if (chainRef.current) {
      disposeLayerMixerChain(chainRef.current);
    }
    chainRef.current = createLayerMixerChain(fftAnalyser, layers);
    if (waveformAnalyser) {
      chainRef.current.masterGain.connect(waveformAnalyser);
    }
  }, [ensureStarted, fftAnalyser, waveformAnalyser, layers]);

  useEffect(() => {
    void rebuild();
    return () => {
      if (chainRef.current) disposeLayerMixerChain(chainRef.current);
    };
  }, [rebuild]);

  const toggle = useCallback(async () => {
    await rebuild();
    if (!chainRef.current) return;
    if (isPlaying) {
      stopLayerMixer(chainRef.current);
      stop();
    } else {
      startLayerMixer(chainRef.current);
      start();
    }
  }, [isPlaying, rebuild, start, stop]);

  return (
    <ExperimentShell
      title={lesson.title}
      description={lesson.description}
      order={lesson.order}
      lesson={{
        objectives: lesson.learningObjectives,
        excerpt: lesson.theoryExcerpt,
        estimatedMinutes: lesson.estimatedMinutes,
      }}
      controls={
        <>
          <LayerPanel layers={layers} onChange={setLayers} />
          <div className="space-y-4">
            <p className="font-mono text-xs text-secondary">
              Stack layers with independent waveforms, levels, and filters.
              Toggle layers to hear how the combined spectrum builds.
            </p>
            <button
              type="button"
              onClick={toggle}
              className={`w-full border px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                isPlaying
                  ? "border-hot text-hot hover:bg-hot/10"
                  : "border-cold text-cold hover:bg-cold/10"
              }`}
            >
              {isPlaying ? "Stop" : "Start"} stack
            </button>
          </div>
        </>
      }
    >
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Combined waveform
        </h2>
        <WaveformOverlay analyser={waveformAnalyser} isActive={isPlaying} />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          FFT — layered spectrum
        </h2>
        <FFTDisplay analyser={fftAnalyser} isActive={isPlaying} />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Spectrograph
        </h2>
        <Spectrograph analyser={fftAnalyser} isActive={isPlaying} />
      </div>
    </ExperimentShell>
  );
}

export function LayeringPlayground({
  lesson,
}: {
  lesson: ExperimentLessonData;
}) {
  return (
    <AudioLabProvider>
      <LayeringInner lesson={lesson} />
    </AudioLabProvider>
  );
}
