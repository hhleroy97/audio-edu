"use client";

import { type NodeProps } from "@xyflow/react";
import {
  displayOctave,
  noteLabelForFrequency,
} from "@/lib/patch/piano-keyboard";
import { usePatchStore } from "@/lib/patch/store";
import { ModuleDisplay, ModuleShell } from "@/lib/patch/ModuleShell";
import { ModuleControlGrid } from "@/lib/patch/ModuleControlGrid";
import {
  DETUNE_CONTROLS,
  ENVELOPE_CONTROLS,
  FILTER_CONTROLS,
  LFO_CONTROLS,
  MIXER_CONTROLS,
  FM_CONTROLS,
  DISTORTION_CONTROLS,
  LAYER_STACK_CONTROLS,
  FORMANT_CONTROLS,
  NOISE_CONTROLS,
  MULTIBAND_CONTROLS,
  MOD_FX_CONTROLS,
  FILTER_BANK_CONTROLS,
  MACRO_CONTROLS,
  OSCILLATOR_CONTROLS,
  OUTPUT_CONTROLS,
  WAVETABLE_CONTROLS,
} from "@/lib/patch/module-controls";
import { WaveformShape } from "@/lib/viz/WaveformShape";
import { parseWaveformType } from "@/lib/viz/waveform-sample";
import { UnisonSpreadDisplay } from "@/lib/viz/UnisonSpreadDisplay";
import { AmplitudeEnvelopeDisplay } from "@/lib/viz/AmplitudeEnvelopeDisplay";
import { FilterResponseDisplay } from "@/lib/viz/FilterResponseDisplay";
import { WavetableDisplay } from "@/lib/viz/WavetableDisplay";
import { DEFAULT_AMPLITUDE_ADSR } from "@/lib/audio/adsr-amplitude";
import { WaveformSelector } from "@/lib/ui/WaveformSelector";
import type { WaveformType } from "@/lib/audio";
import type { PatchNodeData } from "@/lib/patch/ports";
import { LFO_SYNC_OPTIONS } from "@/lib/patch/transport";
import { LFO_SHAPE_OPTIONS, DEFAULT_LFO_CURVE } from "@/lib/patch/lfo-curve";
import { LFO_RATE_RATIO_OPTIONS } from "@/lib/patch/lfo-ratio";
import { FORMANT_VOWELS } from "@/lib/patch/formant-presets";
import { LfoCurveEditor } from "@/lib/viz/LfoCurveEditor";
import { useLiveParamModulation } from "@/lib/patch/useLiveParamModulation";

function isCvTarget(
  edges: { target: string; targetHandle?: string | null }[],
  nodeId: string,
  handle: string
): boolean {
  return edges.some(
    (e) => e.target === nodeId && e.targetHandle === handle && e.targetHandle
  );
}

function moduleLabel(data: PatchNodeData) {
  return data.label;
}

export function OscillatorFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const pianoOctaveOffset = usePatchStore((s) => s.pianoOctaveOffset);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const frequency = Number(params.frequency ?? 261.63);
  const noteLabel = noteLabelForFrequency(frequency);
  const waveform = parseWaveformType(params.waveform);

  return (
    <ModuleShell
      id={props.id}
      kind="oscillator"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "cv-freq", signal: "cv", label: "pitch" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <ModuleDisplay className="mb-2">
        <WaveformShape waveform={waveform} className="w-full" />
      </ModuleDisplay>
      <div className="mb-2">
        <span className="module-label">wave</span>
        <WaveformSelector
          variant="module"
          className="nodrag nopan mt-1"
          value={waveform}
          onChange={(value: WaveformType) =>
            update(props.id, { waveform: value })
          }
        />
      </div>
      <div className="module-readout mb-2">
        <span className="text-[var(--module-accent)]">{noteLabel}</span>
        <span className="text-secondary"> · {frequency.toFixed(0)} Hz</span>
        <p className="mt-1 text-[9px] leading-relaxed text-secondary/70">
          A–K keys · WETYU upper · Oct {displayOctave(pianoOctaveOffset)} Z↓ X↑
        </p>
      </div>
      <ModuleControlGrid
        kind="oscillator"
        layout="oscillator"
        controls={OSCILLATOR_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function DetuneFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const nodes = usePatchStore((s) => s.nodes);
  const edges = usePatchStore((s) => s.edges);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const voices = Math.round(Number(params.voices ?? 3));
  const detune = Number(params.detune ?? 15);
  const spread = Number(params.spread ?? 0.8);
  const kind = data.kind === "unison" ? "unison" : "detune";

  const inEdge = edges.find(
    (e) => e.target === props.id && e.targetHandle === "audio-in"
  );
  const sourceNode = nodes.find((n) => n.id === inEdge?.source);
  const sourceConnected = sourceNode?.data.kind === "oscillator";
  const sourceFreq = sourceConnected
    ? Number(sourceNode.data.params.frequency ?? 220)
    : null;
  const sourceLabel = sourceFreq ? noteLabelForFrequency(sourceFreq) : null;

  return (
    <ModuleShell
      id={props.id}
      kind={kind}
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <ModuleDisplay className="mb-2">
        <UnisonSpreadDisplay
          voices={voices}
          detune={detune}
          spread={spread}
          className="w-full"
        />
      </ModuleDisplay>
      <p className="module-hint mb-2">
        {sourceConnected && sourceLabel ? (
          <>
            tracking{" "}
            <span className="text-[var(--module-accent)]">{sourceLabel}</span>
          </>
        ) : (
          <span className="text-hot">patch osc → in</span>
        )}
      </p>
      <ModuleControlGrid
        kind={kind}
        layout="detune"
        controls={DETUNE_CONTROLS}
        params={params}
        onParamChange={(param, value) =>
          update(props.id, {
            [param]: param === "voices" ? Math.round(value) : value,
          })
        }
      />
    </ModuleShell>
  );
}

export function EnvelopeFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const adsr = {
    attack: Number(params.attack ?? DEFAULT_AMPLITUDE_ADSR.attack),
    decay: Number(params.decay ?? DEFAULT_AMPLITUDE_ADSR.decay),
    sustain: Number(params.sustain ?? DEFAULT_AMPLITUDE_ADSR.sustain),
    release: Number(params.release ?? DEFAULT_AMPLITUDE_ADSR.release),
  };

  return (
    <ModuleShell
      id={props.id}
      kind="envelope"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
      outputs={[
        { id: "audio-out", signal: "audio", label: "out" },
        { id: "cv-out", signal: "cv", label: "cv" },
      ]}
    >
      <ModuleDisplay className="mb-2">
        <AmplitudeEnvelopeDisplay adsr={adsr} className="w-full" />
      </ModuleDisplay>
      <p className="module-hint mb-2">amp + cv · key gated</p>
      <div className="mb-2 flex items-center gap-2">
        <span className="module-label">cv sign</span>
        <button
          type="button"
          className="nodrag nopan border-2 border-module-border bg-module-header px-2 py-0.5 font-mono text-[10px] text-cold hover:border-hot"
          onClick={() =>
            update(props.id, {
              cvSign: Number(params.cvSign ?? 1) >= 0 ? -1 : 1,
            })
          }
        >
          {Number(params.cvSign ?? 1) >= 0 ? "+ unipolar" : "− bipolar"}
        </button>
      </div>
      <ModuleControlGrid
        kind="envelope"
        layout="envelope"
        controls={ENVELOPE_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function OutputFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;

  return (
    <ModuleShell
      id={props.id}
      kind="output"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
    >
      <p className="module-hint mb-2">master bus</p>
      <ModuleControlGrid
        kind="output"
        layout="output"
        controls={OUTPUT_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function AnalyserFlowNode(props: NodeProps) {
  const data = props.data as PatchNodeData;

  return (
    <ModuleShell
      id={props.id}
      kind="analyser"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "thru" }]}
    >
      <ModuleDisplay>
        <div className="flex h-10 items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="module-scope-bar w-1 bg-[var(--module-accent)]"
              style={{ height: `${30 + i * 12}%`, opacity: 0.4 + i * 0.12 }}
            />
          ))}
        </div>
      </ModuleDisplay>
      <p className="module-hint mt-2">tap · pass-through</p>
    </ModuleShell>
  );
}

export function LfoFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const transportBpm = usePatchStore((s) => s.transportBpm);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const sync = String(params.sync ?? "free");
  const shape = String(params.shape ?? "sine");
  const rateRatio = String(params.rateRatio ?? "1");

  return (
    <ModuleShell
      id={props.id}
      kind="lfo"
      label={moduleLabel(data)}
      selected={props.selected}
      outputs={[{ id: "cv-out", signal: "cv", label: "cv" }]}
    >
      <p className="module-hint mb-2">
        {sync === "free" ? "mod · cv out" : `sync ${sync} @ ${transportBpm}bpm`}
      </p>
      <div className="mb-2">
        <span className="module-label">shape</span>
        <select
          className="nodrag nopan mt-1 w-full border-2 border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-primary outline-none focus:border-cold"
          value={shape}
          onChange={(e) => update(props.id, { shape: e.target.value })}
        >
          {LFO_SHAPE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {shape === "custom" ? (
        <div className="mb-2">
          <span className="module-label">curve</span>
          <LfoCurveEditor
            className="nodrag nopan mt-1 w-full"
            value={String(params.curvePoints ?? DEFAULT_LFO_CURVE)}
            onChange={(encoded) => update(props.id, { curvePoints: encoded })}
          />
        </div>
      ) : null}
      <div className="mb-2">
        <span className="module-label">sync</span>
        <select
          className="nodrag nopan mt-1 w-full border-2 border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-primary outline-none focus:border-cold"
          value={sync}
          onChange={(e) => update(props.id, { sync: e.target.value })}
        >
          {LFO_SYNC_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <span className="module-label">ratio</span>
        <select
          className="nodrag nopan mt-1 w-full border-2 border-module-border bg-module-header px-2 py-1 font-mono text-[10px] text-primary outline-none focus:border-cold"
          value={rateRatio}
          onChange={(e) => update(props.id, { rateRatio: e.target.value })}
        >
          {LFO_RATE_RATIO_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <label className="mb-2 flex items-center gap-2 text-[9px] text-secondary">
        <input
          type="checkbox"
          checked={Boolean(params.keyTrack)}
          onChange={(e) => update(props.id, { keyTrack: e.target.checked })}
          className="nodrag nopan accent-hot"
        />
        key-track rate
      </label>
      <ModuleControlGrid
        kind="lfo"
        layout="lfo"
        controls={
          sync === "free"
            ? LFO_CONTROLS
            : LFO_CONTROLS.filter((c) => c.param !== "rate")
        }
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function FilterFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const edges = usePatchStore((s) => s.edges);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const cutoff = Number(params.cutoff ?? 1200);
  const resonance = Number(params.resonance ?? 1);
  const cvCutoff = isCvTarget(edges, props.id, "cv-cutoff");
  const liveCutoff = useLiveParamModulation(props.id, "cv-cutoff", cvCutoff);
  const displayCutoff = liveCutoff ?? cutoff;

  return (
    <ModuleShell
      id={props.id}
      kind="filter"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "audio-in", signal: "audio", label: "in" },
        { id: "cv-cutoff", signal: "cv", label: "cut" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      {cvCutoff ? (
        <p className="module-hint mb-1 text-cold">mod · live cutoff</p>
      ) : null}
      <ModuleDisplay className="mb-2">
        <FilterResponseDisplay
          cutoff={displayCutoff}
          resonance={resonance}
          className="h-16 w-full"
        />
      </ModuleDisplay>
      <ModuleControlGrid
        kind="filter"
        layout="filter"
        controls={FILTER_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function MixerFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;

  return (
    <ModuleShell
      id={props.id}
      kind="mixer"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "audio-in-a", signal: "audio", label: "a" },
        { id: "audio-in-b", signal: "audio", label: "b" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="module-hint mb-2">sub + body sum</p>
      <ModuleControlGrid
        kind="mixer"
        layout="mixer"
        controls={MIXER_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function WavetableFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const position = Number(params.position ?? 0);
  const waveformA = parseWaveformType(params.waveformA);
  const waveformB = parseWaveformType(params.waveformB);
  const frequency = Number(params.frequency ?? 110);

  return (
    <ModuleShell
      id={props.id}
      kind="wavetable"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "cv-pos", signal: "cv", label: "pos" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <ModuleDisplay className="mb-2">
        <WavetableDisplay
          waveformA={waveformA}
          waveformB={waveformB}
          position={position}
          className="w-full"
        />
      </ModuleDisplay>
      <div className="module-readout mb-2 text-[9px] text-secondary">
        {frequency.toFixed(0)} Hz · morph {Math.round(position * 100)}%
      </div>
      <ModuleControlGrid
        kind="wavetable"
        layout="wavetable"
        controls={WAVETABLE_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function FmFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const edges = usePatchStore((s) => s.edges);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const carrierWave = parseWaveformType(params.carrierWave);
  const modWave = parseWaveformType(params.modWave);
  const cvIndex = isCvTarget(edges, props.id, "cv-index");
  const liveIndex = useLiveParamModulation(props.id, "cv-index", cvIndex);
  const index = Number(params.index ?? 300);

  return (
    <ModuleShell
      id={props.id}
      kind="fm"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "cv-index", signal: "cv", label: "idx" },
        { id: "cv-freq", signal: "cv", label: "pitch" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <span className="module-label">carr</span>
          <WaveformSelector
            variant="module"
            className="nodrag nopan mt-1"
            value={carrierWave}
            onChange={(value: WaveformType) =>
              update(props.id, { carrierWave: value })
            }
          />
        </div>
        <div>
          <span className="module-label">mod</span>
          <WaveformSelector
            variant="module"
            className="nodrag nopan mt-1"
            value={modWave}
            onChange={(value: WaveformType) =>
              update(props.id, { modWave: value })
            }
          />
        </div>
      </div>
      <p className="module-hint mb-2">
        FM growl · key gated
        {cvIndex && liveIndex !== undefined
          ? ` · idx ${Math.round(liveIndex)}`
          : cvIndex
            ? " · mod idx"
            : ""}
      </p>
      {!cvIndex ? null : (
        <p className="module-hint mb-1 text-[8px] text-cold">
          base idx {Math.round(index)}
        </p>
      )}
      <ModuleControlGrid
        kind="fm"
        layout="fm"
        controls={FM_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function DistortionFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const type = String(params.type ?? "hard");

  return (
    <ModuleShell
      id={props.id}
      kind="distortion"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <div className="mb-2 flex gap-1">
        {(["hard", "soft"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => update(props.id, { type: mode })}
            className={`nodrag nopan flex-1 border-2 px-2 py-1 font-mono text-[9px] uppercase ${
              type === mode
                ? "border-hot bg-hot/20 text-hot"
                : "border-module-border text-secondary hover:border-cold"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <p className="module-hint mb-2">waveshaper · post-synth</p>
      <ModuleControlGrid
        kind="distortion"
        layout="distortion"
        controls={DISTORTION_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function LayerStackFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;

  return (
    <ModuleShell
      id={props.id}
      kind="layerStack"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "audio-in-sub", signal: "audio", label: "sub" },
        { id: "audio-in-body", signal: "audio", label: "body" },
        { id: "audio-in-top", signal: "audio", label: "top" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="module-hint mb-2">
        sub mono &lt;200 Hz · no CV on sub source
      </p>
      <ModuleControlGrid
        kind="layerStack"
        layout="layerStack"
        controls={LAYER_STACK_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function FormantFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const vowel = String(params.vowel ?? "a");

  return (
    <ModuleShell
      id={props.id}
      kind="formant"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "audio-in", signal: "audio", label: "in" },
        { id: "cv-formant", signal: "cv", label: "vwl" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="module-hint mb-2">vowel bank · yoi formants</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {FORMANT_VOWELS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`nodrag nopan border-2 px-2 py-0.5 font-mono text-[9px] uppercase ${
              vowel === v.id
                ? "border-hot bg-module-header text-hot"
                : "border-module-border bg-module-fill text-secondary hover:border-cold"
            }`}
            onClick={() => update(props.id, { vowel: v.id })}
          >
            {v.label}
          </button>
        ))}
      </div>
      <ModuleControlGrid
        kind="formant"
        layout="formant"
        controls={FORMANT_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function NoiseFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const noiseType = String(params.noiseType ?? "white");

  return (
    <ModuleShell
      id={props.id}
      kind="noise"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "cv-cutoff", signal: "cv", label: "cut" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="module-hint mb-2">noise osc · key gated</p>
      <div className="mb-2 flex gap-1">
        {(["white", "pink"] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={`nodrag nopan flex-1 border-2 py-0.5 font-mono text-[9px] uppercase ${
              noiseType === type
                ? "border-hot bg-module-header text-hot"
                : "border-module-border bg-module-fill text-secondary hover:border-cold"
            }`}
            onClick={() => update(props.id, { noiseType: type })}
          >
            {type}
          </button>
        ))}
      </div>
      <ModuleControlGrid
        kind="noise"
        layout="noise"
        controls={NOISE_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function MultibandFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;

  return (
    <ModuleShell
      id={props.id}
      kind="multiband"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[{ id: "audio-in", signal: "audio", label: "in" }]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="module-hint mb-2">3-band OTT-style dynamics</p>
      <ModuleControlGrid
        kind="multiband"
        layout="multiband"
        controls={MULTIBAND_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function ModFxFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const type = String(params.type ?? "phaser");

  return (
    <ModuleShell
      id={props.id}
      kind="modFx"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "audio-in", signal: "audio", label: "in" },
        { id: "cv-depth", signal: "cv", label: "dep" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <div className="mb-2 flex gap-1">
        {(["phaser", "flanger", "comb"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`nodrag nopan flex-1 border-2 py-0.5 font-mono text-[9px] uppercase ${
              type === mode
                ? "border-hot bg-module-header text-hot"
                : "border-module-border bg-module-fill text-secondary hover:border-cold"
            }`}
            onClick={() => update(props.id, { type: mode })}
          >
            {mode}
          </button>
        ))}
      </div>
      <p className="module-hint mb-2">metallic · movement FX</p>
      <ModuleControlGrid
        kind="modFx"
        layout="modFx"
        controls={MOD_FX_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function FilterBankFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const mode = String(params.mode ?? "serial");

  return (
    <ModuleShell
      id={props.id}
      kind="filterBank"
      label={moduleLabel(data)}
      selected={props.selected}
      inputs={[
        { id: "audio-in", signal: "audio", label: "in" },
        { id: "cv-cutoff", signal: "cv", label: "f1" },
        { id: "cv-cutoff-b", signal: "cv", label: "f2" },
      ]}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <div className="mb-2 flex gap-1">
        {(["serial", "parallel"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={`nodrag nopan flex-1 border-2 py-0.5 font-mono text-[9px] uppercase ${
              mode === m
                ? "border-hot bg-module-header text-hot"
                : "border-module-border bg-module-fill text-secondary hover:border-cold"
            }`}
            onClick={() => update(props.id, { mode: m })}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="module-hint mb-2">dual filter · growl sculpt</p>
      <ModuleControlGrid
        kind="filterBank"
        layout="filterBank"
        controls={FILTER_BANK_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function MacroFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;

  return (
    <ModuleShell
      id={props.id}
      kind="macro"
      label={moduleLabel(data)}
      selected={props.selected}
      outputs={[{ id: "cv-out", signal: "cv", label: "cv" }]}
    >
      <p className="module-hint mb-2">macro · fan-out in mod matrix</p>
      <ModuleControlGrid
        kind="macro"
        layout="macro"
        controls={MACRO_CONTROLS}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export function SamplerFlowNode(props: NodeProps) {
  const update = usePatchStore((s) => s.updateNodeParams);
  const data = props.data as PatchNodeData;
  const params = data.params;
  const hasBuffer = Boolean(String(params.bufferId ?? "").length);

  return (
    <ModuleShell
      id={props.id}
      kind="sampler"
      label={moduleLabel(data)}
      selected={props.selected}
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <p className="module-hint mb-2">
        {hasBuffer ? "resample loop · key gated" : "record from transport panel"}
      </p>
      <ModuleControlGrid
        kind="sampler"
        layout="sampler"
        controls={[
          {
            type: "knob",
            param: "gain",
            label: "Gain",
            min: 0,
            max: 1,
            step: 0.01,
            area: "gain",
          },
        ]}
        params={params}
        onParamChange={(param, value) => update(props.id, { [param]: value })}
      />
    </ModuleShell>
  );
}

export const patchNodeTypes = {
  oscillator: OscillatorFlowNode,
  detune: DetuneFlowNode,
  unison: DetuneFlowNode,
  envelope: EnvelopeFlowNode,
  output: OutputFlowNode,
  analyser: AnalyserFlowNode,
  lfo: LfoFlowNode,
  filter: FilterFlowNode,
  mixer: MixerFlowNode,
  wavetable: WavetableFlowNode,
  fm: FmFlowNode,
  distortion: DistortionFlowNode,
  layerStack: LayerStackFlowNode,
  formant: FormantFlowNode,
  noise: NoiseFlowNode,
  multiband: MultibandFlowNode,
  modFx: ModFxFlowNode,
  filterBank: FilterBankFlowNode,
  macro: MacroFlowNode,
  sampler: SamplerFlowNode,
};
