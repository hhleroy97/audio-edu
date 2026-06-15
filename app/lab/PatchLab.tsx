"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Joyride, STATUS } from "react-joyride";
import type { EventData } from "react-joyride";
import { usePatchStore } from "@/lib/patch/store";
import { patchNodeTypes } from "@/lib/patch/nodes";
import { patchEdgeTypes } from "@/lib/patch/edges";
import { Oscilloscope } from "@/lib/viz/Oscilloscope";
import { SpectrumDisplay } from "@/lib/viz/SpectrumDisplay";
import { SpectrogramDisplay } from "@/lib/viz/SpectrogramDisplay";
import { AgentStateIndicator } from "@/lib/ui/AgentStateIndicator";
import type { NodeKind } from "@/lib/patch/ports";

const SAMPLE_RATE = 48000;

export function PatchLab() {
  const nodes = usePatchStore((s) => s.nodes);
  const edges = usePatchStore((s) => s.edges);
  const isRunning = usePatchStore((s) => s.isRunning);
  const mode = usePatchStore((s) => s.mode);
  const activeLesson = usePatchStore((s) => s.activeLesson);
  const unlockedNodes = usePatchStore((s) => s.unlockedNodes);
  const tourStepIndex = usePatchStore((s) => s.tourStepIndex);
  const enginePhase = usePatchStore((s) => s.enginePhase);
  const onNodesChange = usePatchStore((s) => s.onNodesChange);
  const onEdgesChange = usePatchStore((s) => s.onEdgesChange);
  const onConnect = usePatchStore((s) => s.onConnect);
  const isValidConnection = usePatchStore((s) => s.isValidConnection);
  const addNode = usePatchStore((s) => s.addNode);
  const run = usePatchStore((s) => s.run);
  const stop = usePatchStore((s) => s.stop);
  const advanceTour = usePatchStore((s) => s.advanceTour);
  const getAnalyser = usePatchStore((s) => s.getAnalyser);
  const syncEngine = usePatchStore((s) => s.syncEngine);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    syncEngine();
  }, [syncEngine]);

  useEffect(() => {
    if (isRunning) setAnalyser(getAnalyser());
  }, [isRunning, getAnalyser, edges, nodes]);

  const steps = useMemo(
    () => activeLesson.pages.flatMap((p) => p.steps),
    [activeLesson]
  );

  const joyrideSteps = useMemo(
    () =>
      mode === "guided"
        ? steps.map((s) => ({
            target: s.target ?? "body",
            content: s.content,
            disableBeacon: true,
          }))
        : [],
    [mode, steps]
  );

  const handleJoyride = useCallback(
    (data: EventData) => {
      const { status, type, index } = data;
      if (type === "step:after" && index === tourStepIndex) {
        const step = steps[index];
        if (step?.kind === "demo") return;
        advanceTour();
      }
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        usePatchStore.getState().completeLesson();
      }
    },
    [advanceTour, steps, tourStepIndex]
  );

  const currentStep = steps[tourStepIndex];

  return (
    <div className="flex h-screen flex-col bg-base">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary">
            Patch Lab
          </p>
          <h1 className="text-sm font-medium">{activeLesson.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <AgentStateIndicator
            phase={
              enginePhase === "working"
                ? "working"
                : isRunning
                  ? "settled"
                  : "idle"
            }
            message={isRunning ? "audio live" : "idle"}
          />
          <button
            type="button"
            data-tour-id="transport-run"
            onClick={() => void run()}
            disabled={isRunning}
            className="border border-cold px-4 py-2 font-mono text-xs uppercase text-cold hover:bg-cold/10 disabled:opacity-40"
          >
            ▷ Run
          </button>
          <button
            type="button"
            onClick={() => stop()}
            disabled={!isRunning}
            className="border border-hot px-4 py-2 font-mono text-xs uppercase text-hot hover:bg-hot/10 disabled:opacity-40"
          >
            ■ Stop
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={patchNodeTypes}
            edgeTypes={patchEdgeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            className="bg-base"
          >
            <Background gap={16} color="#2a1f3d" />
            <Controls className="!border-border !bg-surface" />
            <MiniMap
              className="!border-border !bg-surface"
              nodeColor={(n) => (n.type === "output" ? "#8a7fa0" : "#5ec8e8")}
            />
            <Panel position="top-left" className="flex flex-wrap gap-2">
              {unlockedNodes.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => addNode(kind as NodeKind)}
                  className="border border-border bg-surface px-3 py-1 font-mono text-[10px] uppercase text-secondary hover:border-cold hover:text-cold"
                >
                  + {kind}
                </button>
              ))}
            </Panel>
          </ReactFlow>

          {mode === "guided" && currentStep && (
            <div className="absolute bottom-4 left-4 max-w-md border border-border bg-surface/95 p-4 backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-wider text-cold">
                Step {tourStepIndex + 1}/{steps.length} · {currentStep.kind}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{currentStep.content}</p>
              <div className="mt-3 flex gap-2">
                {currentStep.kind === "demo" && (
                  <button
                    type="button"
                    onClick={() => {
                      void run();
                      advanceTour();
                    }}
                    className="border border-cold px-3 py-1 font-mono text-xs text-cold"
                  >
                    Hear demo
                  </button>
                )}
                {currentStep.kind !== "do" && currentStep.kind !== "demo" && (
                  <button
                    type="button"
                    onClick={() => advanceTour()}
                    className="border border-border px-3 py-1 font-mono text-xs text-secondary"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface p-3">
          <Oscilloscope
            analyser={analyser}
            isActive={isRunning}
            sampleRate={SAMPLE_RATE}
            className="mb-4"
          />
          <SpectrumDisplay
            analyser={analyser}
            isActive={isRunning}
            sampleRate={SAMPLE_RATE}
            className="mb-4"
          />
          <SpectrogramDisplay
            analyser={analyser}
            isActive={isRunning}
            sampleRate={SAMPLE_RATE}
          />
        </aside>
      </div>

      {mode === "guided" && joyrideSteps.length > 0 && (
        <Joyride
          steps={joyrideSteps}
          stepIndex={tourStepIndex}
          run={mode === "guided"}
          continuous
          onEvent={handleJoyride}
        />
      )}
    </div>
  );
}
