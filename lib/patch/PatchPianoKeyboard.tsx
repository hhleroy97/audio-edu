"use client";

import { useEffect, useRef } from "react";
import { usePatchStore } from "@/lib/patch/store";
import {
  clampOctaveOffset,
  frequencyForKey,
  isPianoNoteKey,
  isPianoOctaveKey,
  PIANO_OCTAVE_DOWN,
  PIANO_OCTAVE_UP,
} from "@/lib/patch/piano-keyboard";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
}

/**
 * Computer-keyboard piano for oscillator nodes.
 * Middle row = white keys, top row = black keys, Z/X = octave down/up.
 * Pitch only — level stays on the oscillator slider (default 100%).
 */
export function PatchPianoKeyboard() {
  const pianoOctaveOffset = usePatchStore((s) => s.pianoOctaveOffset);
  const setPianoOctaveOffset = usePatchStore((s) => s.setPianoOctaveOffset);
  const isRunning = usePatchStore((s) => s.isRunning);
  const activeLessonSlug = usePatchStore((s) => s.activeLesson.slug);

  const activeKeysRef = useRef(new Set<string>());
  const octaveRef = useRef(pianoOctaveOffset);

  useEffect(() => {
    octaveRef.current = pianoOctaveOffset;
  }, [pianoOctaveOffset]);

  useEffect(() => {
    const ensureRunning = async () => {
      const { isRunning, run } = usePatchStore.getState();
      if (!isRunning) await run();
    };

    const applyNote = (key: string) => {
      const freq = frequencyForKey(key, octaveRef.current);
      if (freq === null) return;
      usePatchStore.getState().updateGeneratorNodesLive({ frequency: freq });
    };

    const refreshFromActiveKeys = () => {
      const keys = [...activeKeysRef.current];
      const { isRunning, setGeneratorKeyGate } = usePatchStore.getState();
      if (keys.length === 0) {
        if (isRunning) setGeneratorKeyGate(false);
        return;
      }
      applyNote(keys[keys.length - 1]!);
      if (isRunning) setGeneratorKeyGate(true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (isPianoOctaveKey(key)) {
        event.preventDefault();
        const delta = key === PIANO_OCTAVE_DOWN ? -1 : 1;
        const next = clampOctaveOffset(octaveRef.current + delta);
        octaveRef.current = next;
        setPianoOctaveOffset(next);
        if (activeKeysRef.current.size > 0) refreshFromActiveKeys();
        return;
      }

      if (!isPianoNoteKey(key)) return;
      if (event.repeat && activeKeysRef.current.has(key)) return;

      event.preventDefault();
      activeKeysRef.current.add(key);
      void (async () => {
        await ensureRunning();
        applyNote(key);
        usePatchStore.getState().setGeneratorKeyGate(true);
      })();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!isPianoNoteKey(key)) return;
      activeKeysRef.current.delete(key);
      refreshFromActiveKeys();
    };

    const onBlur = () => {
      activeKeysRef.current.clear();
      const { isRunning, setGeneratorKeyGate } = usePatchStore.getState();
      if (isRunning) setGeneratorKeyGate(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [setPianoOctaveOffset]);

  useEffect(() => {
    if (!isRunning) {
      activeKeysRef.current.clear();
    }
  }, [isRunning]);

  /** Lesson graph swaps dispose runtime nodes and close the key gate — re-apply if keys still held. */
  useEffect(() => {
    if (activeKeysRef.current.size === 0) return;

    void (async () => {
      const { isRunning, run, updateGeneratorNodesLive, setGeneratorKeyGate } =
        usePatchStore.getState();
      if (!isRunning) await run();

      const keys = [...activeKeysRef.current];
      const key = keys[keys.length - 1]!;
      const freq = frequencyForKey(key, octaveRef.current);
      if (freq !== null) updateGeneratorNodesLive({ frequency: freq });
      setGeneratorKeyGate(true);
    })();
  }, [activeLessonSlug]);

  return null;
}
