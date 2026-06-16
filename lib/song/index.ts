export {
  SongMeta,
  PatchAssignment,
  ModAutomation,
  PatternEvent,
  SectionDef,
  SongDef,
} from "@/lib/schemas/song";
export type {
  SongMetaType,
  PatchAssignmentType,
  ModAutomationType,
  PatternEventType,
  SectionDefType,
  SongDefType,
} from "@/lib/schemas/song";

export { validateSong } from "./validate-song";
export type { SongValidationResult } from "./validate-song";

export {
  beatToSeconds,
  barBeatToAbsolute,
  songTotalBeats,
  songDurationSec,
  flattenSongEvents,
  eventsInBar,
} from "./timeline";
export type { FlatScheduledEvent } from "./timeline";

export {
  SongScheduler,
  scheduleBarTimeline,
} from "./scheduler";
export type { SongSchedulerProgress, SongSchedulerOptions } from "./scheduler";

export {
  triggerPatchNote,
  dispatchPatternEvent,
  buildLayerPresetMap,
  clearPatchNoteTimer,
} from "./trigger-patch-note";
export type { PatchSongBridge, TriggerPatchNoteOptions } from "./trigger-patch-note";

export {
  buildSongManifest,
  collectPresetIds,
  hashSongInputs,
  renderSongOffline,
  encodeWavPcm16,
  manifestToJson,
} from "./render-offline";
export type {
  SongManifest,
  SongManifestSection,
  OfflineRenderResult,
  RenderOfflineOptions,
} from "./render-offline";

export {
  riddimDrop01,
  riddimDropMinimal,
  riddimDropArchetypeStack,
  SONG_TEMPLATES,
  getSongTemplate,
} from "./templates";

export {
  riddim16Standard,
  riddim32Set,
  riddimTearout16,
  MULTIBUS_SONG_TEMPLATES,
  isMultibusSong,
} from "./templates/multibus-riddim";

export { MasterBus } from "./multibus/master-bus";
export { LayerMixStrip } from "./multibus/layer-mix-strip";
export { MasterChain, DEFAULT_MASTER_CHAIN, dbToLinear } from "./multibus/master-chain";
export {
  MIX_STRIP_DEFAULTS,
  inferMixProfile,
  applyMixDefaultsToLayer,
  applyMixDefaultsToLayers,
  stripConfigForProfile,
  resolveMixProfile,
} from "./multibus/mix-profiles";
export type { LayerMixStripConfig } from "./multibus/mix-profiles";
export { MixProfile } from "@/lib/schemas/song";
export type { MixProfileType } from "@/lib/schemas/song";

export {
  analyzeAudioBuffer,
  analyzeSongMix,
  proposeMixDef,
  lintMixDef,
  applyMixDef,
  mergeMixIntoSong,
  runMixPass,
} from "./mix";
export type {
  BufferMetrics,
  SongMixAnalysis,
  MixLintResult,
  MixPassResult,
  MixPassOptions,
} from "./mix";
export { applySongGainToFlow } from "./multibus/layer-engine";
export { LayerEngine } from "./multibus/layer-engine";
export { SongLayerEngine } from "./multibus/song-layer-engine";
export {
  compileMultibusSchedule,
  scheduleEndTime,
} from "./multibus/compile-schedule";
export type { CompiledAction } from "./multibus/compile-schedule";
export {
  MultibusAudioScheduler,
  dispatchMultibusAction,
} from "./multibus/audio-scheduler";
export type {
  MultibusSchedulerProgress,
  MultibusAudioSchedulerOptions,
} from "./multibus/audio-scheduler";

export {
  buildRiddimDrumGrid,
  ensureRiddimDrums,
  sectionDrumHitsForDrop,
  DrumEngine,
  SidechainDucker,
} from "./drums";
export type { RiddimDrumGridOptions } from "./drums";
export { DEFAULT_SIDECHAIN, SidechainDef, DRUM_SAMPLE_IDS } from "@/lib/schemas/drums";
export type { SidechainDefType, DrumSampleId } from "@/lib/schemas/drums";

export {
  runArrangement,
  runArrangementAsync,
  regenerateSection,
  listRulePacks,
  getRulePack,
  ARRANGEMENT_RULE_PACK_LIST,
  runHarmonyAgent,
  runTimbreAgent,
  runEvaluationAgent,
  verifyGoldenSnapshot,
  GOLDEN_ARRANGEMENT_SNAPSHOTS,
} from "./agents";
export type { ArrangementProgressCallback } from "./agents";
export { PIPELINE_AGENT_ORDER, PIPELINE_TOTAL_STEPS } from "./agents/pipeline-yield";
export { buildRiddimPocketGrid, countBounceKicks, drumVelocityStdDev } from "./drums/riddim-pocket";
export { loadAllDrumSamples, DRUM_SAMPLE_PATHS } from "./drums/sample-registry";
export { RiddimPocketDef } from "@/lib/schemas/rhythm";
export type { RiddimPocketDefType } from "@/lib/schemas/rhythm";
export { TimbreDef } from "@/lib/schemas/timbre";
export { ModFxDef } from "@/lib/schemas/mod-fx";
export { songToMidiBuffer, songToMidiBlob } from "./export/midi-export";
export {
  HarmonyDef,
  GrooveDef,
  TransitionDef,
  EvaluationDef,
  EvaluationReport,
} from "@/lib/schemas/harmony";
export type {
  HarmonyDefType,
  SectionHarmonyPlanType,
  EvaluationReportType,
} from "@/lib/schemas/harmony";
export { euclideanRhythm, euclideanBeatHits } from "./pattern/euclidean";
export {
  midiFromScaleDegree,
  scaleNotesForKey,
  createSeededRng,
} from "./pattern/tonal-notes";

export {
  ArrangementRequest,
  ArrangementRun,
  ArrangementAgentEvent,
} from "@/lib/schemas/agents";
export type {
  ArrangementRequestType,
  ArrangementRunType,
  ArrangementAgentEventType,
  ArrangementSubAgentIdType,
} from "@/lib/schemas/agents";
export { ArrangementRulePack } from "@/lib/schemas/rule-pack";
export type { ArrangementRulePackType } from "@/lib/schemas/rule-pack";

export { lintSong } from "./lint-song";
export type { SongLintResult } from "./lint-song";

export { renderMultibusStems } from "./render-stems";
export type { StemRenderResult, StemManifestEntry } from "./render-stems";

export {
  RIDDIM_MOD_PROFILES,
  getModProfile,
  listModProfiles,
  expandModProfile,
  buildHalftimeGroove,
  buildSparseIntroSub,
  buildTopOffbeatStabs,
  buildLayerGainRamp,
  buildRiddimArrangement,
  riddimSickDrop16,
  riddimSickDrop32,
  RIDDIM_ARRANGEMENT_TEMPLATES,
  DEFAULT_RIDDIM_LAYERS,
} from "./riddim";
export type {
  ModKeyframe,
  RiddimModProfile,
  RiddimSectionKind,
  RiddimSectionSpec,
  RiddimArrangementConfig,
} from "./riddim";
