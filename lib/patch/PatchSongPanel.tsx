"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MultibusAudioScheduler,
  SongLayerEngine,
  SongScheduler,
  isMultibusSong,
  lintSong,
  manifestToJson,
  renderMultibusStems,
  renderSongOffline,
  runMixPass,
  songTotalBeats,
  validateSong,
} from "@/lib/song";
import { MixDef } from "@/lib/schemas/mix";
import type { SongDefType } from "@/lib/schemas/song";
import { MULTIBUS_SONG_TEMPLATES, SONG_TEMPLATES } from "@/lib/song/templates";
import { usePatchStore } from "@/lib/patch/store";

const ALL_TEMPLATES = [...MULTIBUS_SONG_TEMPLATES, ...SONG_TEMPLATES];

export function PatchSongPanel() {
  const loadPreset = usePatchStore((s) => s.loadPreset);
  const setTransportBpm = usePatchStore((s) => s.setTransportBpm);
  const setGeneratorKeyGate = usePatchStore((s) => s.setGeneratorKeyGate);
  const updateGeneratorNodesLive = usePatchStore((s) => s.updateGeneratorNodesLive);
  const updateNodeParams = usePatchStore((s) => s.updateNodeParams);
  const run = usePatchStore((s) => s.run);
  const stop = usePatchStore((s) => s.stop);

  const [selectedId, setSelectedId] = useState(ALL_TEMPLATES[0]?.id ?? "");
  const [progressBeat, setProgressBeat] = useState(0);
  const [totalBeats, setTotalBeats] = useState(32);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sectionLabel, setSectionLabel] = useState<string | null>(null);
  const [mixBusy, setMixBusy] = useState(false);

  const layerEngineRef = useRef<SongLayerEngine | null>(null);
  const multibusSchedulerRef = useRef<MultibusAudioScheduler | null>(null);
  const legacySchedulerRef = useRef<SongScheduler | null>(null);

  const song = useMemo((): SongDefType | null => {
    const template = ALL_TEMPLATES.find((t) => t.id === selectedId);
    if (!template) return null;
    try {
      return validateSong(template.song).song;
    } catch (e) {
      return null;
    }
  }, [selectedId]);

  const multibus = song ? isMultibusSong(song) : false;
  const layerIds = song?.layers.map((l) => l.id) ?? [];

  const legacyBridge = useMemo(
    () => ({
      loadPreset,
      setTransportBpm,
      setGeneratorKeyGate,
      updateGeneratorNodesLive,
      updateNodeParams,
      run,
      stop,
    }),
    [
      loadPreset,
      setTransportBpm,
      setGeneratorKeyGate,
      updateGeneratorNodesLive,
      updateNodeParams,
      run,
      stop,
    ]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    layerEngineRef.current = new SongLayerEngine();
    multibusSchedulerRef.current = new MultibusAudioScheduler({
      engine: layerEngineRef.current,
      onProgress: ({ beat, totalBeats: total }) => {
        setProgressBeat(beat);
        setTotalBeats(total);
        if (song) {
          const sec = song.sections.find(
            (s) =>
              beat >= s.startBar * song.meta.beatsPerBar &&
              beat < s.endBar * song.meta.beatsPerBar
          );
          setSectionLabel(sec?.label ?? null);
        }
      },
      onComplete: () => {
        setPlaying(false);
        setStatus("complete");
      },
    });
    legacySchedulerRef.current = new SongScheduler({
      bridge: legacyBridge,
      onProgress: ({ beat, totalBeats: total }) => {
        setProgressBeat(beat);
        setTotalBeats(total);
      },
      onComplete: () => {
        setPlaying(false);
        setStatus("complete");
      },
    });
    return () => {
      multibusSchedulerRef.current?.stop();
      legacySchedulerRef.current?.stop();
      layerEngineRef.current?.dispose();
      layerEngineRef.current = null;
      multibusSchedulerRef.current = null;
      legacySchedulerRef.current = null;
    };
  }, [legacyBridge, song]);

  const playSong = useCallback(async () => {
    if (!song) return;
    setProgressBeat(0);
    setTotalBeats(songTotalBeats(song));
    setPlaying(true);
    setStatus(multibus ? "multibus playing" : "legacy playing");

    if (multibus && multibusSchedulerRef.current) {
      await multibusSchedulerRef.current.play(song);
    } else if (legacySchedulerRef.current) {
      await legacySchedulerRef.current.play(song);
    }
  }, [song, multibus]);

  const stopSong = useCallback(() => {
    multibusSchedulerRef.current?.stop();
    legacySchedulerRef.current?.stop();
    setPlaying(false);
    setStatus("stopped");
  }, []);

  const exportManifest = useCallback(async () => {
    if (!song) return;
    if (multibus) {
      const { masterManifest } = await renderMultibusStems(song);
      const json = manifestToJson(masterManifest);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.meta.id}-stems-manifest.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("stem manifest exported");
    } else {
      const { manifest } = await renderSongOffline(song, { maxDurationSec: 2 });
      const json = manifestToJson(manifest);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.meta.id}-manifest.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("manifest exported");
    }
  }, [song, multibus]);

  const runAutoMix = useCallback(async () => {
    if (!song || !multibus || !layerEngineRef.current) return;
    stopSong();
    setMixBusy(true);
    setStatus("mix pass · analyzing stems…");
    try {
      const result = await runMixPass(song, {
        engine: layerEngineRef.current,
        apply: true,
      });
      const n = result.mix.layers.length;
      setStatus(
        result.applied
          ? `mix pass applied · ${n} layer tweak${n === 1 ? "" : "s"}`
          : `mix pass ready · ${n} proposals (gate: ${result.mix.gate})`
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "mix pass failed");
    } finally {
      setMixBusy(false);
    }
  }, [song, multibus, stopSong]);

  const exportMixDef = useCallback(async () => {
    if (!song || !multibus) return;
    setMixBusy(true);
    setStatus("mix pass · offline analysis…");
    try {
      const { mix } = await runMixPass(song, { apply: false });
      const json = JSON.stringify(MixDef.parse(mix), null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${song.meta.id}-mix-def.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("mix def exported");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "mix export failed");
    } finally {
      setMixBusy(false);
    }
  }, [song, multibus]);

  const lintMessages = song ? lintSong(song) : null;
  const progressPct =
    totalBeats > 0 ? Math.min(100, (progressBeat / totalBeats) * 100) : 0;

  return (
    <div className="mb-4 border-2 border-module-border bg-module-fill p-2">
      <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
        song mode {multibus ? "· multibus" : "· legacy"}
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-[9px] text-secondary">Template</span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="nodrag nopan border border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-cold"
        >
          <optgroup label="multibus arrangements">
            {MULTIBUS_SONG_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="legacy v1">
            {SONG_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {song && (
        <p className="mt-2 text-[8px] leading-snug text-secondary/90">
          {song.meta.bars} bars · {song.meta.bpm} BPM · {song.meta.key}
          {layerIds.length > 0 ? ` · layers: ${layerIds.join("+")}` : ""}
          {sectionLabel ? ` · ${sectionLabel}` : ""}
        </p>
      )}

      {lintMessages && lintMessages.warnings.length > 0 && (
        <p className="mt-1 text-[8px] text-hot/80">
          {lintMessages.warnings[0]}
        </p>
      )}

      <div className="mt-3 h-1.5 w-full border border-module-border bg-module-header">
        <div
          className="h-full bg-cold transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="mt-1 font-mono text-[8px] text-secondary">
        beat {progressBeat.toFixed(1)} / {totalBeats}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void playSong()}
          disabled={!song || playing}
          className="nodrag nopan flex-1 border-2 border-cold bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-cold hover:bg-cold/10 disabled:opacity-40"
        >
          play song
        </button>
        <button
          type="button"
          onClick={stopSong}
          disabled={!playing}
          className="nodrag nopan flex-1 border-2 border-hot bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-hot hover:bg-hot/10 disabled:opacity-40"
        >
          stop
        </button>
      </div>

      <button
        type="button"
        onClick={() => void exportManifest()}
        disabled={!song}
        className="nodrag nopan mt-2 w-full border border-module-border bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-secondary hover:border-cold hover:text-cold disabled:opacity-40"
      >
        {multibus ? "export stem manifest" : "export manifest"}
      </button>

      {multibus && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => void runAutoMix()}
            disabled={!song || playing || mixBusy}
            className="nodrag nopan flex-1 border border-cold bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-cold hover:bg-cold/10 disabled:opacity-40"
          >
            apply mix pass
          </button>
          <button
            type="button"
            onClick={() => void exportMixDef()}
            disabled={!song || mixBusy}
            className="nodrag nopan flex-1 border border-module-border bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-secondary hover:border-cold hover:text-cold disabled:opacity-40"
          >
            export mix def
          </button>
        </div>
      )}

      {status && <p className="mt-2 text-[8px] text-cold/80">{status}</p>}
    </div>
  );
}
