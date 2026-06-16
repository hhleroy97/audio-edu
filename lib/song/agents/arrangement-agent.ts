import { SongDef, type SongDefType } from "@/lib/schemas/song";
import {
  ArrangementRun,
  ArrangementRequest,
  type ArrangementAgentEventType,
  type ArrangementRequestType,
  type ArrangementRunType,
} from "@/lib/schemas/agents";
import { ArrangementRulePack } from "@/lib/schemas/rule-pack";
import { lintSong } from "../lint-song";
import { hashSongInputs } from "../render-offline";
import { DEFAULT_RIDDIM_LAYERS } from "../riddim/patterns";
import { runAutomationAgent, lintAutomationAgent } from "./automation-agent";
import { runDrumAgent, lintDrumAgent } from "./drum-agent";
import { runEvaluationAgent } from "./evaluation-agent";
import { runGrooveAgent, lintGrooveAgent } from "./groove-agent";
import { runHarmonyAgent, lintHarmonyAgent } from "./harmony-agent";
import { runModFxAgent, lintModFxAgent } from "./modfx-agent";
import { runPatternAgent, lintPatternAgent } from "./pattern-agent";
import { getRulePack } from "./rule-packs";
import {
  PIPELINE_TOTAL_STEPS,
  stepIndexForAgent,
  yieldToUi,
} from "./pipeline-yield";
import { runSectionAgent, lintSectionAgent } from "./section-agent";
import { runTimbreAgent, lintTimbreAgent } from "./timbre-agent";
import {
  runTimbreRuntimeAgent,
  lintTimbreRuntimeAgent,
} from "./timbre-runtime-agent";
import { runTransitionAgent, lintTransitionAgent } from "./transition-agent";
import type { z } from "zod";

export type ArrangementProgressCallback = (
  event: ArrangementAgentEventType
) => void;

function emit(
  onProgress: ArrangementProgressCallback | undefined,
  agent: ArrangementAgentEventType["agent"],
  phase: ArrangementAgentEventType["phase"],
  message?: string,
  runPhase?: ArrangementAgentEventType["runPhase"]
): ArrangementAgentEventType {
  const event: ArrangementAgentEventType = {
    agent,
    phase,
    message,
    at: Date.now(),
    stepIndex: stepIndexForAgent(agent),
    totalSteps: PIPELINE_TOTAL_STEPS,
    runPhase,
  };
  onProgress?.(event);
  return event;
}

export type RegenerateSectionOptions = {
  request: z.input<typeof ArrangementRequest>;
  sectionId: string;
  baseSong: SongDefType;
  onProgress?: ArrangementProgressCallback;
};

type PipelineResult = {
  song: SongDefType;
  events: ArrangementAgentEventType[];
  inputsHash: string;
};

type PipelineContext = {
  pack: ReturnType<typeof ArrangementRulePack.parse>;
  req: ArrangementRequestType;
  layers: SongDefType["layers"];
  layerIds: Set<string>;
  beatsPerBar: number;
  maxBeat: number;
};

function runPipelineSync(
  ctx: PipelineContext,
  onProgress?: ArrangementProgressCallback
): PipelineResult {
  const { pack, req, beatsPerBar, maxBeat } = ctx;
  let { layers, layerIds } = ctx;
  let timbrePlans: ReturnType<typeof runTimbreAgent>["plans"] = [];
  const events: ArrangementAgentEventType[] = [];

  const failAgent = (
    agent: ArrangementAgentEventType["agent"],
    msg: string
  ): never => {
    events.push(emit(onProgress, agent, "error", msg, "failed"));
    throw new Error(msg);
  };

  const start = (agent: ArrangementAgentEventType["agent"], message: string) => {
    events.push(emit(onProgress, agent, "start", message, "running"));
  };
  const done = (agent: ArrangementAgentEventType["agent"], message?: string) => {
    events.push(emit(onProgress, agent, "done", message, "running"));
  };

  start("section", "building sections");
  const sectionResult = runSectionAgent(pack, layerIds);
  const sectionLint = lintSectionAgent(sectionResult);
  if (!sectionLint.ok) {
    failAgent("section", `section agent lint: ${sectionLint.errors.join("; ")}`);
  }
  done("section");

  start("harmony", "roman progression → degrees");
  const harmonyResult = runHarmonyAgent(pack, req.seed);
  const harmonyLint = lintHarmonyAgent(harmonyResult);
  if (!harmonyLint.ok) {
    failAgent("harmony", `harmony agent lint: ${harmonyLint.errors.join("; ")}`);
  }
  done("harmony");

  start("timbre", "archetype preset stacks");
  const timbreResult = runTimbreAgent(pack);
  const timbreLint = lintTimbreAgent(timbreResult);
  if (!timbreLint.ok) {
    failAgent("timbre", `timbre agent lint: ${timbreLint.errors.join("; ")}`);
  }
  layers = timbreResult.layers;
  layerIds = new Set(layers.map((l) => l.id));
  timbrePlans = timbreResult.plans;
  done("timbre", `${layers.length} layers`);

  start("pattern", "tonal pattern grid");
  const patternResult = runPatternAgent({
    pack,
    sections: sectionResult.sections,
    seed: req.seed,
    layerIds,
    harmonyPlans: harmonyResult.plans,
  });
  const patternLint = lintPatternAgent(patternResult, maxBeat, beatsPerBar);
  if (!patternLint.ok) {
    failAgent("pattern", `pattern agent lint: ${patternLint.errors.join("; ")}`);
  }
  done("pattern");

  start("transition", "pre-drop ramps");
  const transitionResult = runTransitionAgent({
    pack,
    sections: patternResult.sections,
  });
  const transitionLint = lintTransitionAgent(transitionResult);
  if (!transitionLint.ok) {
    failAgent(
      "transition",
      `transition agent lint: ${transitionLint.errors.join("; ")}`
    );
  }
  done("transition");

  start("groove", "ghost snares + euclidean hats");
  const grooveResult = runGrooveAgent({
    pack,
    sections: transitionResult.sections,
    seed: req.seed,
    layerIds,
  });
  const grooveLint = lintGrooveAgent(grooveResult);
  if (!grooveLint.ok) {
    failAgent("groove", `groove agent lint: ${grooveLint.errors.join("; ")}`);
  }
  done("groove");

  start("timbreRuntime", "section preset swaps");
  const timbreRuntimeResult = runTimbreRuntimeAgent({
    sections: grooveResult.sections,
    plans: timbrePlans,
    layerIds,
  });
  const timbreRuntimeLint = lintTimbreRuntimeAgent(timbreRuntimeResult);
  if (!timbreRuntimeLint.ok) {
    failAgent(
      "timbreRuntime",
      `timbre runtime lint: ${timbreRuntimeLint.errors.join("; ")}`
    );
  }
  done("timbreRuntime");

  const draftMeta = {
    id: `${pack.id}-${req.seed}`,
    title: pack.title,
    bpm: pack.bpm,
    key: pack.key,
    bars: pack.bars,
    beatsPerBar,
    rootMidi: harmonyResult.rootMidi,
    gate: pack.gate,
    version: 2 as const,
  };

  start("drum", "riddim pocket grid");
  const drumResult = runDrumAgent({
    pack,
    draft: { sections: timbreRuntimeResult.sections, meta: draftMeta },
    seed: req.seed,
    drumExtras: grooveResult.drumExtras,
  });
  const drumLint = lintDrumAgent(drumResult);
  if (!drumLint.ok) {
    failAgent("drum", `drum agent lint: ${drumLint.errors.join("; ")}`);
  }
  done("drum", `${drumResult.drums.hits.length} hits`);

  let merged = SongDef.parse({
    meta: draftMeta,
    schemaVersion: 2,
    layers,
    sections: timbreRuntimeResult.sections,
    drums: drumResult.drums,
  });

  start("automation", "mod profile expansion");
  const autoResult = runAutomationAgent({
    pack,
    sections: merged.sections,
    layerIds,
  });
  const autoLint = lintAutomationAgent(autoResult);
  if (!autoLint.ok) {
    failAgent(
      "automation",
      `automation agent lint: ${autoLint.errors.join("; ")}`
    );
  }
  merged = SongDef.parse({ ...merged, sections: autoResult.sections });
  done("automation");

  start("modfx", "top mod + drum sends");
  const modFxResult = runModFxAgent({
    pack,
    sections: merged.sections,
    drums: merged.drums ?? drumResult.drums,
    layerIds,
  });
  const modFxLint = lintModFxAgent(modFxResult);
  if (!modFxLint.ok) {
    failAgent("modfx", `modfx agent lint: ${modFxLint.errors.join("; ")}`);
  }
  merged = SongDef.parse({
    ...merged,
    sections: modFxResult.sections,
    drums: modFxResult.drums,
  });
  done("modfx");

  start("evaluation", "quality gates");
  const evalReport = runEvaluationAgent(merged, pack);
  if (!evalReport.ok) {
    failAgent(
      "evaluation",
      `evaluation failed: ${evalReport.errors.join("; ")}`
    );
  }
  done(
    "evaluation",
    `${evalReport.metrics.totalNoteCount} notes · ${evalReport.metrics.drumHitCount} drums`
  );

  start("mix", "song lint");
  events.push(emit(onProgress, "mix", "lint", "song lint", "running"));
  const songLint = lintSong(merged);
  if (!songLint.ok) {
    failAgent("mix", `song lint: ${songLint.errors.join("; ")}`);
  }
  events.push(
    emit(onProgress, "mix", "done", "SongDef validated", "complete")
  );

  const inputsHash = hashSongInputs(merged);
  return { song: merged, events, inputsHash };
}

async function runPipelineAsync(
  ctx: PipelineContext,
  onProgress?: ArrangementProgressCallback
): Promise<PipelineResult> {
  const syncResult = runPipelineSync(ctx);

  const agents = [
    "section",
    "harmony",
    "timbre",
    "pattern",
    "transition",
    "groove",
    "timbreRuntime",
    "drum",
    "automation",
    "modfx",
    "evaluation",
    "mix",
  ] as const;

  for (const agent of agents) {
    const startEv = syncResult.events.find(
      (e) => e.agent === agent && e.phase === "start"
    );
    if (startEv) {
      onProgress?.({ ...startEv, runPhase: "running" });
    }
    await yieldToUi();

    const doneEv =
      syncResult.events.find(
        (e) => e.agent === agent && e.phase === "done"
      ) ??
      syncResult.events.find(
        (e) => e.agent === agent && e.phase === "lint"
      );
    if (doneEv) {
      onProgress?.({
        ...doneEv,
        runPhase: agent === "mix" ? "complete" : "running",
      });
    }
    await yieldToUi();
  }

  return syncResult;
}

/** Sync supervisor — used in tests and golden snapshots. */
export function runArrangement(
  request: ArrangementRequestType | z.input<typeof ArrangementRequest>,
  onProgress?: ArrangementProgressCallback
): ArrangementRunType {
  const req = ArrangementRequest.parse(request);
  const rawPack = getRulePack(req.rulePackId);
  if (!rawPack) throw new Error(`unknown rule pack: ${req.rulePackId}`);

  const pack = ArrangementRulePack.parse({
    ...rawPack,
    bpm: req.bpm ?? rawPack.bpm,
    bars: req.bars ?? rawPack.bars,
    key: req.key ?? rawPack.key,
  });

  const layers = pack.layers ?? DEFAULT_RIDDIM_LAYERS;
  const layerIds = new Set(layers.map((l) => l.id));
  const beatsPerBar = pack.beatsPerBar;
  const maxBeat = pack.bars * beatsPerBar;
  const maxRetries = req.maxEvalRetries ?? 0;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptSeed = attempt === 0 ? req.seed : `${req.seed}-eval${attempt}`;
    const attemptReq = { ...req, seed: attemptSeed };
    try {
      const { song, events, inputsHash } = runPipelineSync(
        {
          pack,
          req: attemptReq,
          layers,
          layerIds,
          beatsPerBar,
          maxBeat,
        },
        onProgress
      );
      return ArrangementRun.parse({
        id: `run-${pack.id}-${attemptSeed}-${inputsHash}`,
        request: attemptReq,
        song,
        events,
        inputsHash,
        gate: pack.gate,
      });
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt >= maxRetries) break;
      emit(onProgress, "evaluation", "lint", `retry ${attempt + 1}/${maxRetries}`, "running");
    }
  }

  throw lastError ?? new Error("arrangement failed");
}

/** Async supervisor — yields between sub-agents for Patch Lab progress UI (#105). */
export async function runArrangementAsync(
  request: ArrangementRequestType | z.input<typeof ArrangementRequest>,
  onProgress?: ArrangementProgressCallback
): Promise<ArrangementRunType> {
  const req = ArrangementRequest.parse(request);
  const rawPack = getRulePack(req.rulePackId);
  if (!rawPack) throw new Error(`unknown rule pack: ${req.rulePackId}`);

  const pack = ArrangementRulePack.parse({
    ...rawPack,
    bpm: req.bpm ?? rawPack.bpm,
    bars: req.bars ?? rawPack.bars,
    key: req.key ?? rawPack.key,
  });

  const layers = pack.layers ?? DEFAULT_RIDDIM_LAYERS;
  const layerIds = new Set(layers.map((l) => l.id));
  const beatsPerBar = pack.beatsPerBar;
  const maxBeat = pack.bars * beatsPerBar;
  const maxRetries = req.maxEvalRetries ?? 0;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptSeed = attempt === 0 ? req.seed : `${req.seed}-eval${attempt}`;
    const attemptReq = { ...req, seed: attemptSeed };
    try {
      const { song, events, inputsHash } = await runPipelineAsync(
        {
          pack,
          req: attemptReq,
          layers,
          layerIds,
          beatsPerBar,
          maxBeat,
        },
        onProgress
      );
      return ArrangementRun.parse({
        id: `run-${pack.id}-${attemptSeed}-${inputsHash}`,
        request: attemptReq,
        song,
        events,
        inputsHash,
        gate: pack.gate,
      });
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt >= maxRetries) break;
      emit(onProgress, "evaluation", "lint", `retry ${attempt + 1}/${maxRetries}`, "running");
      await yieldToUi();
    }
  }

  emit(onProgress, "mix", "error", lastError?.message ?? "failed", "failed");
  throw lastError ?? new Error("arrangement failed");
}

/** Re-run pattern + automation for one section; keeps other sections intact. */
export function regenerateSection(
  options: RegenerateSectionOptions
): SongDefType {
  const { sectionId, baseSong, onProgress } = options;
  const request = ArrangementRequest.parse(options.request);
  const pack = getRulePack(request.rulePackId);
  if (!pack) throw new Error(`unknown rule pack: ${request.rulePackId}`);

  const spec = pack.sections.find((s) => s.id === sectionId);
  if (!spec) throw new Error(`unknown section: ${sectionId}`);

  const layerIds = new Set(baseSong.layers.map((l) => l.id));
  const harmonyResult = runHarmonyAgent(pack, `${request.seed}:${sectionId}`);

  emit(onProgress, "pattern", "start", `regenerate ${sectionId}`, "running");
  const sectionOnly = baseSong.sections.filter((s) => s.id === sectionId);
  let patternResult = runPatternAgent({
    pack,
    sections: sectionOnly.map((s) => ({ ...s, events: [] })),
    seed: `${request.seed}:${sectionId}`,
    layerIds,
    harmonyPlans: harmonyResult.plans.filter((p) => p.sectionId === sectionId),
  });

  const transitionResult = runTransitionAgent({
    pack,
    sections: patternResult.sections,
  });
  const grooveResult = runGrooveAgent({
    pack,
    sections: transitionResult.sections,
    seed: `${request.seed}:${sectionId}`,
    layerIds,
  });
  const timbreResult = runTimbreAgent(pack);
  const timbreRuntimeResult = runTimbreRuntimeAgent({
    sections: grooveResult.sections,
    plans: timbreResult.plans,
    layerIds,
  });
  patternResult = { sections: timbreRuntimeResult.sections };

  emit(onProgress, "pattern", "done", undefined, "running");
  emit(onProgress, "automation", "start", sectionId, "running");
  const autoResult = runAutomationAgent({
    pack,
    sections: patternResult.sections,
    layerIds,
  });
  emit(onProgress, "automation", "done", undefined, "running");

  const updated = autoResult.sections[0];
  if (!updated) throw new Error("regenerate produced no section");

  const sections = baseSong.sections.map((s) =>
    s.id === sectionId ? updated : s
  );

  const merged = SongDef.parse({ ...baseSong, sections });
  const evalReport = runEvaluationAgent(merged, pack);
  if (!evalReport.ok) {
    throw new Error(`evaluation failed: ${evalReport.errors.join("; ")}`);
  }

  emit(onProgress, "mix", "done", "section regenerated", "complete");
  return merged;
}
