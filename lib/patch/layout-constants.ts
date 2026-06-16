import { NODE_LAYOUT_METADATA } from "./node-layout";

export { NODE_LAYOUT_METADATA } from "./node-layout";
export { getNodeDimensions, type NodeDimensionMap } from "./node-layout";

/** @deprecated Use NODE_LAYOUT_METADATA[kind].width */
export const NODE_WIDTH = NODE_LAYOUT_METADATA.oscillator.width;

/** @deprecated Use NODE_LAYOUT_METADATA[kind].height */
export const NODE_HEIGHT = Object.fromEntries(
  Object.entries(NODE_LAYOUT_METADATA).map(([kind, size]) => [kind, size.height])
) as Record<keyof typeof NODE_LAYOUT_METADATA, number>;

export const COLUMN_GAP = 100;
export const ROW_GAP = 48;
export const TAP_ROW_OFFSET = 160;
export const LAYOUT_PADDING = { x: 64, y: 72 };

export const snapGrid = (value: number) => Math.round(value / 16) * 16;

export const DEFAULT_COLUMN_STRIDE = snapGrid(
  NODE_LAYOUT_METADATA.oscillator.width + COLUMN_GAP
);
