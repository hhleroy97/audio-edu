import { SongDef, type SongDefType } from "@/lib/schemas/song";
import type { z } from "zod";
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
import { runPatternAgent, lintPatternAgent } from "./pattern-agent";
import { getRulePack } from "./rule-packs";
import { runSectionAgent, lintSectionAgent } from "./section-agent";

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

/** Supervisor — fixed pipeline: section → pattern → drum → merge → automation → lint. */
export function runArrangement(
  request: ArrangementRequestType | z.input<typeof ArrangementRequest>,
  onProgress?: ArrangementProgressCallback
): ArrangementRunType {
  const events: ArrangementAgentEventType[] = [];
  const req = ArrangementRequest.parse(request);

  const rawPack = getRulePack(req.rulePackId);
  if (!rawPack) {
    throw new Error(`unknown rule pack: ${req.rulePackId}`);
  }

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

  events.push(emit(onProgress, "section", "start", "building sections"));
  const sectionResult = runSectionAgent(pack, layerIds);
  const sectionLint = lintSectionAgent(sectionResult);
  if (!sectionLint.ok) {
    events.push(
      emit(onProgress, "section", "error", sectionLint.errors.join("; "))
    );
    throw new Error(`section agent lint: ${sectionLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "section", "done"));

  events.push(emit(onProgress, "pattern", "start", "tonal pattern grid"));
  const patternResult = runPatternAgent({
    pack,
    sections: sectionResult.sections,
    seed: req.seed,
    layerIds,
  });
  const patternLint = lintPatternAgent(patternResult, maxBeat, beatsPerBar);
  if (!patternLint.ok) {
    events.push(
      emit(onProgress, "pattern", "error", patternLint.errors.join("; "))
    );
    throw new Error(`pattern agent lint: ${patternLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "pattern", "done"));

  const draftMeta = {
    id: `${pack.id}-${req.seed}`,
    title: pack.title,
    bpm: pack.bpm,
    key: pack.key,
    bars: pack.bars,
    beatsPerBar,
    gate: pack.gate,
    version: 2 as const,
  };

  events.push(emit(onProgress, "drum", "start", "drum lane + euclidean hats"));
  const drumResult = runDrumAgent({
    pack,
    draft: { sections: patternResult.sections, meta: draftMeta },
    seed: req.seed,
    hatEuclidean: { pulses: 5, steps: 16 },
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
    sections: patternResult.sections,
    drums: drumResult.drums,
  });

  events.push(emit(onProgress, "automation", "start", "mod profile expansion"));
  const autoResult = runAutomationAgent({ pack, sections: merged.sections, layerIds });
  const autoLint = lintAutomationAgent(autoResult);
  if (!autoLint.ok) {
    events.push(
      emit(onProgress, "automation", "error", autoLint.errors.join("; "))
    );
    throw new Error(`automation agent lint: ${autoLint.errors.join("; ")}`);
  }
  merged = SongDef.parse({ ...merged, sections: autoResult.sections });
  events.push(emit(onProgress, "automation", "done"));

  events.push(emit(onProgress, "mix", "lint", "song lint"));
  const songLint = lintSong(merged);
  if (!songLint.ok) {
    events.push(emit(onProgress, "mix", "error", songLint.errors.join("; ")));
    throw new Error(`song lint: ${songLint.errors.join("; ")}`);
  }
  events.push(emit(onProgress, "mix", "done", "SongDef validated"));

  const inputsHash = hashSongInputs(merged);

  return ArrangementRun.parse({
    id: `run-${pack.id}-${req.seed}-${inputsHash}`,
    request: req,
    song: merged,
    events,
    inputsHash,
    gate: pack.gate,
  });
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

  emit(onProgress, "pattern", "start", `regenerate ${sectionId}`);
  const sectionOnly = baseSong.sections.filter((s) => s.id === sectionId);
  const patternResult = runPatternAgent({
    pack,
    sections: sectionOnly.map((s) => ({ ...s, events: [] })),
    seed: `${request.seed}:${sectionId}`,
    layerIds: new Set(baseSong.layers.map((l) => l.id)),
  });
  emit(onProgress, "pattern", "done");

  emit(onProgress, "automation", "start", sectionId);
  const autoResult = runAutomationAgent({
    pack,
    sections: patternResult.sections,
    layerIds: new Set(baseSong.layers.map((l) => l.id)),
  });
  emit(onProgress, "automation", "done");

  const updated = autoResult.sections[0];
  if (!updated) throw new Error("regenerate produced no section");

  const sections = baseSong.sections.map((s) =>
    s.id === sectionId ? updated : s
  );

  return SongDef.parse({ ...baseSong, sections });
}
