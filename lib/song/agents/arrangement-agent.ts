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
import { runPatternAgent, lintPatternAgent } from "./pattern-agent";
import { getRulePack } from "./rule-packs";
import { runSectionAgent, lintSectionAgent } from "./section-agent";
import { runTransitionAgent, lintTransitionAgent } from "./transition-agent";
import type { z } from "zod";

export type ArrangementProgressCallback = (
  event: ArrangementAgentEventType
) => void;

function emit(
  onProgress: ArrangementProgressCallback | undefined,
  agent: ArrangementAgentEventType["agent"],
  phase: ArrangementAgentEventType["phase"],
  message?: string
): ArrangementAgentEventType {
  const event: ArrangementAgentEventType = {
    agent,
    phase,
    message,
    at: Date.now(),
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

function runPipeline(
  pack: ReturnType<typeof ArrangementRulePack.parse>,
  req: ArrangementRequestType,
  layers: SongDefType["layers"],
  layerIds: Set<string>,
  beatsPerBar: number,
  maxBeat: number,
  onProgress?: ArrangementProgressCallback
): PipelineResult {
  const events: ArrangementAgentEventType[] = [];

  events.push(emit(onProgress, "section", "start", "building sections"));
  const sectionResult = runSectionAgent(pack, layerIds);
  const sectionLint = lintSectionAgent(sectionResult);
  if (!sectionLint.ok) {
    events.push(emit(onProgress, "section", "error", sectionLint.errors.join("; ")));
    throw new Error(`section agent lint: ${sectionLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "section", "done"));

  events.push(emit(onProgress, "harmony", "start", "roman progression → degrees"));
  const harmonyResult = runHarmonyAgent(pack, req.seed);
  const harmonyLint = lintHarmonyAgent(harmonyResult);
  if (!harmonyLint.ok) {
    events.push(emit(onProgress, "harmony", "error", harmonyLint.errors.join("; ")));
    throw new Error(`harmony agent lint: ${harmonyLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "harmony", "done"));

  events.push(emit(onProgress, "pattern", "start", "tonal pattern grid"));
  const patternResult = runPatternAgent({
    pack,
    sections: sectionResult.sections,
    seed: req.seed,
    layerIds,
    harmonyPlans: harmonyResult.plans,
  });
  const patternLint = lintPatternAgent(patternResult, maxBeat, beatsPerBar);
  if (!patternLint.ok) {
    events.push(emit(onProgress, "pattern", "error", patternLint.errors.join("; ")));
    throw new Error(`pattern agent lint: ${patternLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "pattern", "done"));

  events.push(emit(onProgress, "transition", "start", "pre-drop ramps"));
  const transitionResult = runTransitionAgent({
    pack,
    sections: patternResult.sections,
  });
  const transitionLint = lintTransitionAgent(transitionResult);
  if (!transitionLint.ok) {
    events.push(emit(onProgress, "transition", "error", transitionLint.errors.join("; ")));
    throw new Error(`transition agent lint: ${transitionLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "transition", "done"));

  events.push(emit(onProgress, "groove", "start", "ghost snares + euclidean hats"));
  const grooveResult = runGrooveAgent({
    pack,
    sections: transitionResult.sections,
    seed: req.seed,
    layerIds,
  });
  const grooveLint = lintGrooveAgent(grooveResult);
  if (!grooveLint.ok) {
    events.push(emit(onProgress, "groove", "error", grooveLint.errors.join("; ")));
    throw new Error(`groove agent lint: ${grooveLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "groove", "done"));

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

  events.push(emit(onProgress, "drum", "start", "kick/snare grid"));
  const drumResult = runDrumAgent({
    pack,
    draft: { sections: grooveResult.sections, meta: draftMeta },
    seed: req.seed,
    drumExtras: grooveResult.drumExtras,
  });
  const drumLint = lintDrumAgent(drumResult);
  if (!drumLint.ok) {
    events.push(emit(onProgress, "drum", "error", drumLint.errors.join("; ")));
    throw new Error(`drum agent lint: ${drumLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "drum", "done"));

  let merged = SongDef.parse({
    meta: draftMeta,
    schemaVersion: 2,
    layers,
    sections: grooveResult.sections,
    drums: drumResult.drums,
  });

  events.push(emit(onProgress, "automation", "start", "mod profile expansion"));
  const autoResult = runAutomationAgent({ pack, sections: merged.sections, layerIds });
  const autoLint = lintAutomationAgent(autoResult);
  if (!autoLint.ok) {
    events.push(emit(onProgress, "automation", "error", autoLint.errors.join("; ")));
    throw new Error(`automation agent lint: ${autoLint.errors.join("; ")}`);
  }
  merged = SongDef.parse({ ...merged, sections: autoResult.sections });
  events.push(emit(onProgress, "automation", "done"));

  events.push(emit(onProgress, "evaluation", "start", "quality gates"));
  const evalReport = runEvaluationAgent(merged, pack);
  if (!evalReport.ok) {
    events.push(emit(onProgress, "evaluation", "error", evalReport.errors.join("; ")));
    throw new Error(`evaluation failed: ${evalReport.errors.join("; ")}`);
  }
  events.push(
    emit(
      onProgress,
      "evaluation",
      "done",
      `${evalReport.metrics.totalNoteCount} notes · ${evalReport.metrics.drumHitCount} drums`
    )
  );

  events.push(emit(onProgress, "mix", "lint", "song lint"));
  const songLint = lintSong(merged);
  if (!songLint.ok) {
    events.push(emit(onProgress, "mix", "error", songLint.errors.join("; ")));
    throw new Error(`song lint: ${songLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "mix", "done", "SongDef validated"));

  const inputsHash = hashSongInputs(merged);
  return { song: merged, events, inputsHash };
}

/** Supervisor — section → harmony → pattern → transition → groove → drum → automation → evaluation → lint. */
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
      const { song, events, inputsHash } = runPipeline(
        pack,
        attemptReq,
        layers,
        layerIds,
        beatsPerBar,
        maxBeat,
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
      emit(onProgress, "evaluation", "lint", `retry ${attempt + 1}/${maxRetries}`);
    }
  }

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

  emit(onProgress, "pattern", "start", `regenerate ${sectionId}`);
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
  patternResult = { sections: grooveResult.sections };

  emit(onProgress, "pattern", "done");
  emit(onProgress, "automation", "start", sectionId);
  const autoResult = runAutomationAgent({
    pack,
    sections: patternResult.sections,
    layerIds,
  });
  emit(onProgress, "automation", "done");

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

  return merged;
}
