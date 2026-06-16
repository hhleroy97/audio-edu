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
  OSCILLATOR_CONTROLS,
  OUTPUT_CONTROLS,
} from "@/lib/patch/module-controls";
import { WaveformShape } from "@/lib/viz/WaveformShape";
import { parseWaveformType } from "@/lib/viz/waveform-sample";
import { UnisonSpreadDisplay } from "@/lib/viz/UnisonSpreadDisplay";
import { AmplitudeEnvelopeDisplay } from "@/lib/viz/AmplitudeEnvelopeDisplay";
import { DEFAULT_AMPLITUDE_ADSR } from "@/lib/audio/adsr-amplitude";
import { WaveformSelector } from "@/lib/ui/WaveformSelector";
import type { WaveformType } from "@/lib/audio";
import type { PatchNodeData } from "@/lib/patch/ports";

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
      outputs={[{ id: "audio-out", signal: "audio", label: "out" }]}
    >
      <ModuleDisplay className="mb-2">
        <AmplitudeEnvelopeDisplay adsr={adsr} className="w-full" />
      </ModuleDisplay>
      <p className="module-hint mb-2">amplitude · key gated</p>
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

export const patchNodeTypes = {
  oscillator: OscillatorFlowNode,
  detune: DetuneFlowNode,
  unison: DetuneFlowNode,
  envelope: EnvelopeFlowNode,
  output: OutputFlowNode,
  analyser: AnalyserFlowNode,
};
