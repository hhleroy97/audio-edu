"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ARRANGEMENT_RULE_PACK_LIST,
  ArrangementRulePack,
  MultibusAudioScheduler,
  SongLayerEngine,
  SongScheduler,
  getRulePack,
  isMultibusSong,
  lintSong,
  manifestToJson,
  regenerateSection,
  renderMultibusStems,
  renderSongOffline,
  runArrangementAsync,
  runMixPass,
  songToMidiBlob,
  songTotalBeats,
  validateSong,
} from "@/lib/song";
import type { ArrangementAgentEventType } from "@/lib/schemas/agents";
import { MixDef } from "@/lib/schemas/mix";
import type { SongDefType } from "@/lib/schemas/song";
import { MULTIBUS_SONG_TEMPLATES, SONG_TEMPLATES } from "@/lib/song/templates";
import { usePatchStore } from "@/lib/patch/store";
import { ArrangementPipelineStepper } from "@/lib/patch/ArrangementPipelineStepper";

const ALL_TEMPLATES = [...MULTIBUS_SONG_TEMPLATES, ...SONG_TEMPLATES];

type SongSource = "template" | "generated";

export function PatchSongPanel() {
  const loadPreset = usePatchStore((s) => s.loadPreset);
  const setTransportBpm = usePatchStore((s) => s.setTransportBpm);
  const setGeneratorKeyGate = usePatchStore((s) => s.setGeneratorKeyGate);
  const updateGeneratorNodesLive = usePatchStore((s) => s.updateGeneratorNodesLive);
  const updateNodeParams = usePatchStore((s) => s.updateNodeParams);
  const run = usePatchStore((s) => s.run);
  const stop = usePatchStore((s) => s.stop);

  const [songSource, setSongSource] = useState<SongSource>("template");
  const [selectedId, setSelectedId] = useState(ALL_TEMPLATES[0]?.id ?? "");
  const [rulePackId, setRulePackId] = useState(
    ARRANGEMENT_RULE_PACK_LIST[0]?.id ?? "riddim-standard-16"
  );
  const [seed, setSeed] = useState("lab-default");
  const [generatedSong, setGeneratedSong] = useState<SongDefType | null>(null);
  const [inputsHash, setInputsHash] = useState<string | null>(null);
  const [agentEvents, setAgentEvents] = useState<ArrangementAgentEventType[]>([]);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [genComplete, setGenComplete] = useState(false);
  const [genFailed, setGenFailed] = useState(false);
  const [regenSectionId, setRegenSectionId] = useState("");
  const [showRulePackJson, setShowRulePackJson] = useState(false);

  const [progressBeat, setProgressBeat] = useState(0);
  const [totalBeats, setTotalBeats] = useState(32);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sectionLabel, setSectionLabel] = useState<string | null>(null);
  const [mixBusy, setMixBusy] = useState(false);

  const layerEngineRef = useRef<SongLayerEngine | null>(null);
  const multibusSchedulerRef = useRef<MultibusAudioScheduler | null>(null);
  const legacySchedulerRef = useRef<SongScheduler | null>(null);

  const rulePackJson = useMemo(() => {
    const pack = getRulePack(rulePackId);
    if (!pack) return "";
    try {
      return JSON.stringify(ArrangementRulePack.parse(pack), null, 2);
    } catch {
      return "";
    }
  }, [rulePackId]);

  const templateSong = useMemo((): SongDefType | null => {
    const template = ALL_TEMPLATES.find((t) => t.id === selectedId);
    if (!template) return null;
    try {
      return validateSong(template.song).song;
    } catch {
      return null;
    }
  }, [selectedId]);

  const song =
    songSource === "generated" && generatedSong ? generatedSong : templateSong;

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

  const handleGenerate = useCallback(async () => {
    stopSong();
    setGenerateBusy(true);
    setGenComplete(false);
    setGenFailed(false);
    setAgentEvents([]);
    setStatus("arrangement · generating…");
    try {
      const run = await runArrangementAsync({ rulePackId, seed }, (ev) => {
        setAgentEvents((prev) => [...prev, ev]);
      });
      setGeneratedSong(run.song);
      setInputsHash(run.inputsHash ?? null);
      setSongSource("generated");
      setGenComplete(true);
      setStatus(`generated · ${run.song.meta.title} · hash ${run.inputsHash}`);
    } catch (e) {
      setGenFailed(true);
      setStatus(e instanceof Error ? e.message : "generation failed");
    } finally {
      setGenerateBusy(false);
    }
  }, [rulePackId, seed, stopSong]);

  const handleRegenSection = useCallback(() => {
    if (!generatedSong || !regenSectionId) return;
    stopSong();
    setGenerateBusy(true);
    setStatus(`regenerating ${regenSectionId}…`);
    try {
      const updated = regenerateSection({
        request: { rulePackId, seed },
        sectionId: regenSectionId,
        baseSong: generatedSong,
        onProgress: (ev) => {
          setAgentEvents((prev) => [...prev, ev]);
        },
      });
      setGeneratedSong(updated);
      setStatus(`section ${regenSectionId} regenerated`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "regenerate failed");
    } finally {
      setGenerateBusy(false);
    }
  }, [generatedSong, regenSectionId, rulePackId, seed, stopSong]);

  const exportMidi = useCallback(() => {
    if (!song) return;
    const blob = songToMidiBlob(song);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.meta.id}.mid`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("midi exported");
  }, [song]);

  const exportSongDef = useCallback(() => {
    if (!song) return;
    const json = JSON.stringify(song, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.meta.id}-song-def.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("song def exported");
  }, [song]);

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
        {songSource === "generated" ? " · generated" : ""}
      </p>

      <div className="mb-3 border border-module-border bg-module-header/40 p-2">
        <p className="mb-2 font-mono text-[8px] uppercase tracking-wider text-cold">
          arrangement agent
        </p>
        <label className="flex flex-col gap-1">
          <span className="text-[9px] text-secondary">Rule pack</span>
          <select
            value={rulePackId}
            onChange={(e) => setRulePackId(e.target.value)}
            className="nodrag nopan border border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-cold"
          >
            {ARRANGEMENT_RULE_PACK_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-[9px] text-secondary">Seed</span>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="nodrag nopan border border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-cold"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowRulePackJson((v) => !v)}
          className="nodrag nopan mt-2 w-full border border-module-border bg-module-header px-2 py-1 font-mono text-[8px] uppercase text-secondary hover:text-cold"
        >
          {showRulePackJson ? "hide rule pack" : "view rule pack JSON"}
        </button>
        {showRulePackJson && rulePackJson && (
          <pre className="nodrag nopan mt-1 max-h-32 overflow-auto border border-module-border bg-module-header p-1 font-mono text-[7px] text-secondary/90">
            {rulePackJson}
          </pre>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generateBusy || playing}
          className="nodrag nopan mt-2 w-full border-2 border-hot bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-hot hover:bg-hot/10 disabled:opacity-40"
        >
          {generateBusy ? "generating…" : "generate song"}
        </button>
        {agentEvents.length > 0 || generateBusy || genComplete ? (
          <ArrangementPipelineStepper
            events={agentEvents}
            busy={generateBusy}
            complete={genComplete}
            failed={genFailed}
          />
        ) : null}
        {generatedSong && (
          <div className="mt-2 flex gap-1">
            <select
              value={regenSectionId}
              onChange={(e) => setRegenSectionId(e.target.value)}
              className="nodrag nopan flex-1 border border-module-border bg-module-header px-1 py-0.5 font-mono text-[8px] text-secondary"
            >
              <option value="">regen section…</option>
              {generatedSong.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRegenSection}
              disabled={!regenSectionId || generateBusy}
              className="nodrag nopan border border-module-border px-2 py-0.5 font-mono text-[8px] uppercase text-secondary hover:text-cold disabled:opacity-40"
            >
              regen
            </button>
          </div>
        )}
        {inputsHash && (
          <p className="mt-1 font-mono text-[7px] text-secondary/80">
            hash {inputsHash}
          </p>
        )}
      </div>

      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setSongSource("template")}
          className={`nodrag nopan flex-1 border px-1 py-0.5 font-mono text-[8px] uppercase ${
            songSource === "template"
              ? "border-cold text-cold"
              : "border-module-border text-secondary"
          }`}
        >
          template
        </button>
        <button
          type="button"
          onClick={() => setSongSource("generated")}
          disabled={!generatedSong}
          className={`nodrag nopan flex-1 border px-1 py-0.5 font-mono text-[8px] uppercase ${
            songSource === "generated"
              ? "border-cold text-cold"
              : "border-module-border text-secondary"
          } disabled:opacity-40`}
        >
          generated
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[9px] text-secondary">Template</span>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setSongSource("template");
          }}
          disabled={songSource === "generated"}
          className="nodrag nopan border border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-cold disabled:opacity-50"
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
        <>
          <p className="mt-2 text-[8px] leading-snug text-secondary/90">
            {song.meta.bars} bars · {song.meta.bpm} BPM · {song.meta.key}
            {layerIds.length > 0 ? ` · layers: ${layerIds.join("+")}` : ""}
            {sectionLabel ? ` · ${sectionLabel}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {song.sections.map((sec) => (
              <span
                key={sec.id}
                className="font-mono text-[7px] border border-module-border px-1 text-secondary/90"
                title={`${sec.events.length} events`}
              >
                {sec.label} ({sec.endBar - sec.startBar}b)
              </span>
            ))}
          </div>
        </>
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

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={exportSongDef}
          disabled={!song}
          className="nodrag nopan flex-1 border border-module-border bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-secondary hover:border-cold hover:text-cold disabled:opacity-40"
        >
          export song def
        </button>
        <button
          type="button"
          onClick={exportMidi}
          disabled={!song}
          className="nodrag nopan flex-1 border border-module-border bg-module-header px-2 py-1 font-mono text-[9px] uppercase text-secondary hover:border-cold hover:text-cold disabled:opacity-40"
        >
          export midi
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
