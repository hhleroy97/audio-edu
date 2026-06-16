"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { usePatchStore } from "@/lib/patch/store";
import { patchNodeTypes } from "@/lib/patch/nodes";
import { patchEdgeTypes } from "@/lib/patch/edges";
import { PatchKeyboardHandler } from "@/lib/patch/PatchKeyboardHandler";
import { PatchPianoKeyboard } from "@/lib/patch/PatchPianoKeyboard";
import { PatchFitView } from "@/lib/patch/PatchFitView";
import { PatchLayoutSync } from "@/lib/patch/PatchLayoutSync";
import { PatchConnectionLine } from "@/lib/patch/PatchConnectionLine";
import { PatchRewireSession } from "@/lib/patch/PatchRewireSession";
import { ModulePalette } from "@/lib/patch/ModulePalette";
import { PatchPresetPanel } from "@/lib/patch/PatchPresetPanel";
import { PatchSignalTapPanel } from "@/lib/patch/PatchSignalTapPanel";
import { PatchTransportPanel } from "@/lib/patch/PatchTransportPanel";
import { PatchModMatrix } from "@/lib/patch/PatchModMatrix";
import { isScopeTappable } from "@/lib/patch/scope-tap";
import type { NodeKind } from "@/lib/patch/ports";
import { isDoStepSatisfied } from "@/lib/patch/tour-utils";
import { Oscilloscope } from "@/lib/viz/Oscilloscope";
import { SpectrumDisplay } from "@/lib/viz/SpectrumDisplay";
import { SpectrogramDisplay } from "@/lib/viz/SpectrogramDisplay";
import { AgentStateIndicator } from "@/lib/ui/AgentStateIndicator";
import { LessonPanel, LessonPanelCollapsed } from "@/lib/ui/LessonPanel";
import { getNextLesson } from "@/lib/patch/lessons/index";
import type { LessonPanelView } from "@/lib/ui/LessonPanel";

const SAMPLE_RATE = 48000;

export function PatchLab() {
  const nodes = usePatchStore((s) => s.nodes);
  const edges = usePatchStore((s) => s.edges);
  const isRunning = usePatchStore((s) => s.isRunning);
  const mode = usePatchStore((s) => s.mode);
  const activeLesson = usePatchStore((s) => s.activeLesson);
  const unlockedNodes = usePatchStore((s) => s.unlockedNodes);
  const tourStepIndex = usePatchStore((s) => s.tourStepIndex);
  const lessonPanelOpen = usePatchStore((s) => s.lessonPanelOpen);
  const showCompletionChoice = usePatchStore((s) => s.showCompletionChoice);
  const enginePhase = usePatchStore((s) => s.enginePhase);
  const onNodesChange = usePatchStore((s) => s.onNodesChange);
  const onEdgesChange = usePatchStore((s) => s.onEdgesChange);
  const onNodeDragStart = usePatchStore((s) => s.onNodeDragStart);
  const onConnect = usePatchStore((s) => s.onConnect);
  const onReconnect = usePatchStore((s) => s.onReconnect);
  const isValidConnection = usePatchStore((s) => s.isValidConnection);
  const addNode = usePatchStore((s) => s.addNode);
  const run = usePatchStore((s) => s.run);
  const stop = usePatchStore((s) => s.stop);
  const advanceTour = usePatchStore((s) => s.advanceTour);
  const finishGuidedSteps = usePatchStore((s) => s.finishGuidedSteps);
  const choosePlayground = usePatchStore((s) => s.choosePlayground);
  const chooseNextLesson = usePatchStore((s) => s.chooseNextLesson);
  const setLessonPanelOpen = usePatchStore((s) => s.setLessonPanelOpen);
  const dismissTour = usePatchStore((s) => s.dismissTour);
  const getAnalyser = usePatchStore((s) => s.getAnalyser);
  const scopeTapNodeId = usePatchStore((s) => s.scopeTapNodeId);
  const syncEngine = usePatchStore((s) => s.syncEngine);
  const updateGeneratorNodesLive = usePatchStore(
    (s) => s.updateGeneratorNodesLive
  );
  const setGeneratorKeyGate = usePatchStore((s) => s.setGeneratorKeyGate);
  const cancelRewire = usePatchStore((s) => s.cancelRewire);
  const setScopeTapNodeId = usePatchStore((s) => s.setScopeTapNodeId);
  const isRewiring = usePatchStore((s) => s.rewireDraft !== null);

  const isLayoutAnimating = usePatchStore((s) => s.isLayoutAnimating);

  const edgeDoubleClickRef = useRef<
    (event: React.MouseEvent, edge: Edge) => void
  >(() => {});
  const registerEdgeDoubleClick = useCallback(
    (handler: (event: React.MouseEvent, edge: Edge) => void) => {
      edgeDoubleClickRef.current = handler;
    },
    []
  );
  const handleEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      edgeDoubleClickRef.current(event, edge);
    },
    []
  );

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const steps = useMemo(
    () => activeLesson.pages.flatMap((p) => p.steps),
    [activeLesson]
  );

  const isGuided =
    mode === "guided" &&
    !showCompletionChoice &&
    tourStepIndex < steps.length;
  const currentStep = isGuided ? steps[tourStepIndex] : null;
  const isLastStep = isGuided && tourStepIndex === steps.length - 1;

  const nextLesson = getNextLesson(activeLesson.slug);
  const nextLessonTitle = nextLesson?.title ?? null;

  const panelView: LessonPanelView = showCompletionChoice
    ? "completion-choice"
    : mode === "guided"
      ? "step"
      : "playground-recap";

  useEffect(() => {
    syncEngine();
  }, [syncEngine]);

  useEffect(() => {
    if (isRunning) setAnalyser(getAnalyser());
  }, [isRunning, getAnalyser, edges, nodes, scopeTapNodeId]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string; data: { kind: string } }) => {
      if (isScopeTappable(node.data.kind as NodeKind)) {
        setScopeTapNodeId(node.id);
      }
    },
    [setScopeTapNodeId]
  );

  /** Highlight current tour target without a blocking joyride overlay. */
  useEffect(() => {
    document
      .querySelectorAll("[data-tour-highlight]")
      .forEach((el) => el.removeAttribute("data-tour-highlight"));

    if (!isGuided || !currentStep?.target) return;

    const target = document.querySelector(currentStep.target);
    target?.setAttribute("data-tour-highlight", "true");

    return () => {
      target?.removeAttribute("data-tour-highlight");
    };
  }, [isGuided, currentStep?.target, tourStepIndex]);

  /** Auto-advance "do" steps when the learner satisfies the requirement. */
  useEffect(() => {
    if (!isGuided || !currentStep || currentStep.kind !== "do") return;
    if (!isDoStepSatisfied(currentStep, edges)) return;

    const timer = window.setTimeout(() => advanceTour(), 400);
    return () => window.clearTimeout(timer);
  }, [isGuided, currentStep, edges, advanceTour, tourStepIndex]);

  const handleContinue = useCallback(() => {
    if (isLastStep) {
      finishGuidedSteps();
    } else {
      advanceTour();
    }
  }, [isLastStep, finishGuidedSteps, advanceTour]);

  return (
    <div className="flex h-screen flex-col bg-base">
      <header className="patch-lab-header flex items-center justify-between px-4 py-3">
        <div>
          <p className="patch-lab-header__tag inline-block bg-[#ff2d9522] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.35em] text-[#ff2d95]">
            Rack / 01
          </p>
          <h1 className="mt-1 text-sm font-medium tracking-wide text-primary">
            {activeLesson.title}
          </h1>
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
          {isGuided && (
            <button
              type="button"
              onClick={dismissTour}
              className="border border-border px-3 py-2 font-mono text-xs uppercase text-secondary hover:border-cold hover:text-cold"
            >
              Skip lesson
            </button>
          )}
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
        {!lessonPanelOpen ? (
          <LessonPanelCollapsed onExpand={() => setLessonPanelOpen(true)} />
        ) : (
          <LessonPanel
            lesson={activeLesson}
            steps={steps}
            stepIndex={tourStepIndex}
            view={panelView}
            nextLessonTitle={nextLessonTitle}
            isLastStep={isLastStep}
            onContinue={handleContinue}
            onDismiss={dismissTour}
            onDemo={() => {
              void (async () => {
                await run();
                updateGeneratorNodesLive({ frequency: 261.63 });
                setGeneratorKeyGate(true);
                handleContinue();
              })();
            }}
            onChoosePlayground={choosePlayground}
            onChooseNextLesson={chooseNextLesson}
            onCollapse={() => setLessonPanelOpen(false)}
            onStartNextFromRecap={chooseNextLesson}
          />
        )}

        <div className="relative min-w-0 flex-1">
          <ReactFlow
            key={activeLesson.slug}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onEdgeDoubleClick={handleEdgeDoubleClick}
            isValidConnection={isValidConnection}
            edgesReconnectable
            nodeTypes={patchNodeTypes}
            edgeTypes={patchEdgeTypes}
            connectionLineComponent={PatchConnectionLine}
            deleteKeyCode={null}
            elementsSelectable
            zoomOnDoubleClick={false}
            minZoom={0.35}
            maxZoom={1.5}
            snapToGrid
            snapGrid={[16, 16]}
            className={`patch-lab-canvas${isLayoutAnimating ? " is-layout-animating" : ""}${isRewiring ? " is-rewiring" : ""}`}
            onPaneClick={() => cancelRewire()}
            onNodeClick={handleNodeClick}
          >
            <PatchFitView
              nodeCount={nodes.length}
              lessonSlug={activeLesson.slug}
            />
            <PatchRewireSession onReady={registerEdgeDoubleClick} />
            <PatchLayoutSync />
            <PatchKeyboardHandler />
            <PatchPianoKeyboard />
            <Background gap={32} size={1} color="#1e1830" />
            <Controls className="!border-module-border !bg-module-fill !shadow-none [&>button]:!border-module-border [&>button]:!bg-module-header" />
            <MiniMap
              className="!border-module-border !bg-module-fill"
              nodeColor={() => "#5ec8e8"}
              maskColor="rgba(6, 4, 10, 0.85)"
            />
            <Panel position="top-right" className="patch-lab-palette !m-2 max-h-[70vh] max-w-52 overflow-hidden">
              <p className="border-b-2 border-module-border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
                presets
              </p>
              <div className="max-h-[60vh] overflow-y-auto">
                <PatchPresetPanel />
              </div>
            </Panel>
            <Panel position="top-left" className="patch-lab-palette !m-2 overflow-hidden">
              <p className="border-b-2 border-module-border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.3em] text-secondary">
                modules
              </p>
              <ModulePalette
                kinds={unlockedNodes}
                onAdd={(kind) => addNode(kind)}
              />
            </Panel>
          </ReactFlow>
        </div>

        <aside className="patch-lab-aside flex w-80 shrink-0 flex-col overflow-y-auto p-3">
          <PatchTransportPanel />
          <PatchModMatrix />
          <PatchSignalTapPanel />
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
    </div>
  );
}
