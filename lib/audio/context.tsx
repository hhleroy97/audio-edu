"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as Tone from "tone";

export type WaveformType = "sine" | "square" | "sawtooth" | "triangle";

type AudioContextValue = {
  isReady: boolean;
  isPlaying: boolean;
  analyser: Tone.Analyser | null;
  ensureStarted: () => Promise<void>;
  start: () => void;
  stop: () => void;
};

const AudioLabContext = createContext<AudioContextValue | null>(null);

export function AudioLabProvider({ children }: { children: ReactNode }) {
  const [analyser, setAnalyser] = useState<Tone.Analyser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const ensureStarted = useCallback(async () => {
    await Tone.start();
    if (!analyser) {
      const node = new Tone.Analyser("fft", 2048);
      node.toDestination();
      setAnalyser(node);
    }
    setIsReady(true);
  }, [analyser]);

  const start = useCallback(() => setIsPlaying(true), []);
  const stop = useCallback(() => setIsPlaying(false), []);

  const value = useMemo(
    () => ({
      isReady,
      isPlaying,
      analyser,
      ensureStarted,
      start,
      stop,
    }),
    [isReady, isPlaying, analyser, ensureStarted, start, stop]
  );

  return (
    <AudioLabContext.Provider value={value}>{children}</AudioLabContext.Provider>
  );
}

export function useAudioLab() {
  const ctx = useContext(AudioLabContext);
  if (!ctx) {
    throw new Error("useAudioLab must be used within AudioLabProvider");
  }
  return ctx;
}

export function useAnalyserNode(): Tone.Analyser | null {
  const { analyser } = useAudioLab();
  return analyser;
}
