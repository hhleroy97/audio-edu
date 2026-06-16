export {
  RIDDIM_MOD_PROFILES,
  getModProfile,
  listModProfiles,
  expandModProfile,
} from "./mod-schemas";
export type { ModKeyframe, RiddimModProfile } from "./mod-schemas";

export {
  buildHalftimeGroove,
  buildSparseIntroSub,
  buildTopOffbeatStabs,
  buildLayerGainRamp,
  DEFAULT_RIDDIM_LAYERS,
  DEFAULT_SUB_MIDI,
  DEFAULT_BODY_MIDI,
} from "./patterns";
export type { HalftimeGrooveOptions, LayerGainRamp } from "./patterns";

export {
  buildRiddimArrangement,
  riddimSickDrop16,
  riddimSickDrop32,
  RIDDIM_ARRANGEMENT_TEMPLATES,
} from "./arrangement-builder";
export type {
  RiddimSectionKind,
  RiddimSectionSpec,
  RiddimArrangementConfig,
} from "./arrangement-builder";
