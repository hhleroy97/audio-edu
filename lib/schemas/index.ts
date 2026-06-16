export { ExperimentMetadata, Gating } from "./metadata";
export type { ExperimentMetadata as ExperimentMetadataType } from "./metadata";
export { GraphNode, GraphEdge, KnowledgeGraph } from "./graph";
export { TutorialChunk } from "./tutorial";
export {
  SongMeta,
  PatchAssignment,
  ModAutomation,
  PatternEvent,
  SectionDef,
  SongDef,
  SongLayerDef,
  MixProfile,
  DrumHit,
  DrumLaneDef,
  PatternCombinator,
} from "./song";
export type {
  SongMetaType,
  PatchAssignmentType,
  ModAutomationType,
  PatternEventType,
  SectionDefType,
  SongDefType,
  SongLayerDefType,
  MixProfileType,
  DrumHitType,
  PatternCombinatorType,
} from "./song";
export {
  StemMetrics,
  LayerMixAdjust,
  MasterMixAdjust,
  MixAnalysis,
  MixDef,
} from "./mix";
export type {
  StemMetricsType,
  LayerMixAdjustType,
  MasterMixAdjustType,
  MixAnalysisType,
  MixDefType,
} from "./mix";
export { ExperimentFrontmatter } from "./frontmatter";
export { PortType, PatchNode, PatchEdge, Patch, PatchPreset, TourStep, Lesson } from "./patch";
export {
  PatchEdgeData,
  DEFAULT_CV_EDGE_DATA,
  normalizeModDepth,
  parseCvEdgeData,
} from "./patch-edge-data";
export type {
  PortType as PortTypeValue,
  PatchNode as PatchNodeType,
  PatchEdge as PatchEdgeType,
  Patch as PatchType,
  PatchPreset as PatchPresetType,
  TourStep as TourStepType,
  Lesson as LessonType,
} from "./patch";
