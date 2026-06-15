"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLabProvider,
  useAudioLab,
  useAnalyserNode,
  createWavetableChain,
  updateWavetableChain,
  startWavetable,
  stopWavetable,
  disposeWavetable,
  DEFAULT_WAVETABLE,
  type WavetableParams,
  type WavetableChain,
} from "@/lib/audio";
import { FFTDisplay, Spectrograph, WavetableDisplay } from "@/lib/viz";
import { ExperimentShell, ParamSlider } from "@/lib/ui";
import type { ExperimentLessonData } from "@/lib/experiments/load-lesson";

function WavetableInner({ lesson }: { lesson: ExperimentLessonData }) {
  const { isPlaying, ensureStarted, start, stop } = useAudioLab();
  const fftAnalyser = useAnalyserNode();
  const chainRef = useRef<WavetableChain | null>(null);
  const [params, setParams] = useState<WavetableParams>(DEFAULT_WAVETABLE);

  const rebuild = useCallback(async () => {
    await ensureStarted();
    if (!fftAnalyser) return;
    if (!chainRef.current) {
      chainRef.current = createWavetableChain(fftAnalyser, params);
    } else {
      updateWavetableChain(chainRef.current, params);
    }
  }, [ensureStarted, fftAnalyser, params]);

  useEffect(() => {
    void rebuild();
    return () => {
      if (chainRef.current) disposeWavetable(chainRef.current);
    };
  }, [rebuild]);

  const toggle = useCallback(async () => {
    await rebuild();
    if (!chainRef.current) return;
    if (isPlaying) {
      stopWavetable(chainRef.current);
      stop();
    } else {
      startWavetable(chainRef.current);
      start();
    }
  }, [isPlaying, rebuild, start, stop]);

  const patch = (p: Partial<WavetableParams>) =>
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
            <ParamSlider
              label="Wavetable position"
              value={params.position}
              min={0}
              max={1}
              step={0.01}
              onChange={(position) => patch({ position })}
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
              label="Amplitude"
              value={params.amplitude}
              min={0}
              max={1}
              step={0.01}
              onChange={(amplitude) => patch({ amplitude })}
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
              {isPlaying ? "Stop" : "Start"} morph
            </button>
          </div>
          <p className="font-mono text-xs text-secondary">
            Gray = sine frame, red = saw frame, blue = morphed output. Sweep
            position while playing to hear timbre change.
          </p>
        </>
      }
    >
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Morph preview
        </h2>
        <WavetableDisplay
          waveformA={params.waveformA}
          waveformB={params.waveformB}
          position={params.position}
        />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          FFT
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

export function WavetablePlayground({
  lesson,
}: {
  lesson: ExperimentLessonData;
}) {
  return (
    <AudioLabProvider>
      <WavetableInner lesson={lesson} />
    </AudioLabProvider>
  );
}
