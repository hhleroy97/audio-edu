"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLabProvider,
  useAudioLab,
  useAnalyserNode,
  createFilterChain,
  updateFilterChain,
  disposeFilterChain,
  DEFAULT_FILTER,
  type FilterParams,
  type FilterChain,
  type WaveformType,
} from "@/lib/audio";
import { FFTDisplay, Spectrograph, FilterResponseDisplay } from "@/lib/viz";
import {
  ExperimentShell,
  ParamSlider,
  WaveformSelector,
} from "@/lib/ui";
import type { ExperimentLessonData } from "@/lib/experiments/load-lesson";

function FilteringInner({ lesson }: { lesson: ExperimentLessonData }) {
  const { isPlaying, ensureStarted, start, stop } = useAudioLab();
  const fftAnalyser = useAnalyserNode();
  const chainRef = useRef<FilterChain | null>(null);
  const [params, setParams] = useState<FilterParams>(DEFAULT_FILTER);

  const rebuild = useCallback(async () => {
    await ensureStarted();
    if (!fftAnalyser) return;
    if (!chainRef.current) {
      chainRef.current = createFilterChain(fftAnalyser, params);
    } else {
      updateFilterChain(chainRef.current, params);
    }
  }, [ensureStarted, fftAnalyser, params]);

  useEffect(() => {
    void rebuild();
    return () => {
      if (chainRef.current) disposeFilterChain(chainRef.current);
    };
  }, [rebuild]);

  const toggle = useCallback(async () => {
    await rebuild();
    if (!chainRef.current) return;
    if (isPlaying) {
      chainRef.current.osc.stop();
      stop();
    } else {
      chainRef.current.osc.start();
      start();
    }
  }, [isPlaying, rebuild, start, stop]);

  const patch = (p: Partial<FilterParams>) =>
    setParams((prev) => ({ ...prev, ...p }));

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
          <div className="space-y-6">
            <WaveformSelector
              value={params.waveform}
              onChange={(waveform: WaveformType) => patch({ waveform })}
            />
            <ParamSlider
              label="Cutoff"
              value={params.cutoff}
              min={80}
              max={8000}
              step={10}
              unit=" Hz"
              onChange={(cutoff) => patch({ cutoff })}
            />
            <ParamSlider
              label="Resonance"
              value={params.resonance}
              min={0.1}
              max={18}
              step={0.1}
              onChange={(resonance) => patch({ resonance })}
            />
            <ParamSlider
              label="Frequency"
              value={params.frequency}
              min={40}
              max={600}
              step={1}
              unit=" Hz"
              onChange={(frequency) => patch({ frequency })}
            />
            <button
              type="button"
              onClick={toggle}
              className={`w-full border px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                isPlaying
                  ? "border-hot text-hot hover:bg-hot/10"
                  : "border-cold text-cold hover:bg-cold/10"
              }`}
            >
              {isPlaying ? "Stop" : "Start"} filter
            </button>
          </div>
          <p className="font-mono text-xs text-secondary">
            Lower the cutoff — watch harmonics disappear from the FFT. Red line
            marks cutoff on the response curve.
          </p>
        </>
      }
    >
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Frequency response
        </h2>
        <FilterResponseDisplay
          cutoff={params.cutoff}
          resonance={params.resonance}
        />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          FFT — removed harmonics
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

export function FilteringPlayground({
  lesson,
}: {
  lesson: ExperimentLessonData;
}) {
  return (
    <AudioLabProvider>
      <FilteringInner lesson={lesson} />
    </AudioLabProvider>
  );
}
