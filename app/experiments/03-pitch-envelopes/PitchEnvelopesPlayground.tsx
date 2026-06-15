"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLabProvider,
  useAudioLab,
  useAnalyserNode,
  createPitchOscillatorChain,
  applyPitchEnvelope,
  disposePitchChain,
  DEFAULT_ADSR,
  DEFAULT_OSCILLATOR,
  type ADSRParams,
  type PitchEnvelopeChain,
  type WaveformType,
} from "@/lib/audio";
import { FFTDisplay, Spectrograph, EnvelopeCurve } from "@/lib/viz";
import {
  ExperimentShell,
  EnvelopeEditor,
  ParamSlider,
  WaveformSelector,
} from "@/lib/ui";
import type { ExperimentLessonData } from "@/lib/experiments/load-lesson";

const NOTE_DURATION = 1.2;

function PitchEnvelopesInner({ lesson }: { lesson: ExperimentLessonData }) {
  const { isPlaying, ensureStarted, start, stop } = useAudioLab();
  const fftAnalyser = useAnalyserNode();
  const chainRef = useRef<PitchEnvelopeChain | null>(null);
  const [adsr, setAdsr] = useState<ADSRParams>(DEFAULT_ADSR);
  const [frequency, setFrequency] = useState(DEFAULT_OSCILLATOR.frequency);
  const [amplitude, setAmplitude] = useState(0.4);
  const [waveform, setWaveform] = useState<WaveformType>(
    DEFAULT_OSCILLATOR.waveform
  );

  const ensureChain = useCallback(async () => {
    await ensureStarted();
    if (!fftAnalyser) return;
    if (chainRef.current) disposePitchChain(chainRef.current);
    chainRef.current = createPitchOscillatorChain(
      fftAnalyser,
      frequency,
      waveform,
      amplitude
    );
  }, [ensureStarted, fftAnalyser, frequency, waveform, amplitude]);

  useEffect(() => {
    void ensureChain();
    return () => {
      if (chainRef.current) disposePitchChain(chainRef.current);
    };
  }, [ensureChain]);

  const trigger = useCallback(async () => {
    await ensureChain();
    if (!chainRef.current) return;
    if (isPlaying) {
      chainRef.current.osc.stop();
      stop();
    } else {
      chainRef.current.osc.start();
      applyPitchEnvelope(
        chainRef.current.osc,
        frequency,
        adsr,
        NOTE_DURATION
      );
      start();
      setTimeout(() => {
        chainRef.current?.osc.stop();
        stop();
      }, (NOTE_DURATION + adsr.release) * 1000);
    }
  }, [adsr, ensureChain, frequency, isPlaying, start, stop]);

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
            <WaveformSelector value={waveform} onChange={setWaveform} />
            <ParamSlider
              label="Base frequency"
              value={frequency}
              min={40}
              max={400}
              step={1}
              unit=" Hz"
              onChange={setFrequency}
            />
            <ParamSlider
              label="Amplitude"
              value={amplitude}
              min={0}
              max={1}
              step={0.01}
              onChange={setAmplitude}
            />
            <EnvelopeEditor value={adsr} onChange={setAdsr} />
            <button
              type="button"
              onClick={trigger}
              className={`w-full border px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                isPlaying
                  ? "border-hot text-hot hover:bg-hot/10"
                  : "border-cold text-cold hover:bg-cold/10"
              }`}
            >
              {isPlaying ? "Playing…" : "Trigger envelope"}
            </button>
          </div>
          <p className="font-mono text-xs text-secondary">
            Watch the spectrograph trace pitch falling — classic RIDDIM bass
            pitch sweep.
          </p>
        </>
      }
    >
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Envelope curve
        </h2>
        <EnvelopeCurve adsr={adsr} />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          FFT
        </h2>
        <FFTDisplay analyser={fftAnalyser} isActive={isPlaying} />
      </div>
      <div>
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
          Spectrograph — pitch over time
        </h2>
        <Spectrograph analyser={fftAnalyser} isActive={isPlaying} />
      </div>
    </ExperimentShell>
  );
}

export function PitchEnvelopesPlayground({
  lesson,
}: {
  lesson: ExperimentLessonData;
}) {
  return (
    <AudioLabProvider>
      <PitchEnvelopesInner lesson={lesson} />
    </AudioLabProvider>
  );
}
