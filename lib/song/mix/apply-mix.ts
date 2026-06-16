import type { MixDefType } from "@/lib/schemas/mix";
import type { SongDefType } from "@/lib/schemas/song";
import type { SongLayerEngine } from "../multibus/song-layer-engine";

/** Apply validated MixDef to a live or offline SongLayerEngine. */
export function applyMixDef(
  engine: SongLayerEngine,
  mix: MixDefType,
  atTime?: number
): void {
  for (const adj of mix.layers) {
    if (adj.busGain !== undefined) {
      engine.setLayerGain(adj.layerId, adj.busGain, atTime);
    }
    if (adj.songGain !== undefined) {
      engine.getLayer(adj.layerId)?.setSongGain(adj.songGain);
    }
    if (adj.hpfHz !== undefined || adj.lpfHz !== undefined) {
      engine.masterBus.setLayerStripEq(adj.layerId, {
        hpfHz: adj.hpfHz,
        lpfHz: adj.lpfHz,
      });
    }
  }

  if (mix.master) {
    engine.masterBus.setMasterChainParams(mix.master, atTime);
  }
}

/** Merge MixDef layer adjustments back into SongDef layer defs (for re-export). */
export function mergeMixIntoSong(
  song: SongDefType,
  mix: MixDefType
): SongDefType {
  const adjustById = new Map(mix.layers.map((a) => [a.layerId, a]));
  return {
    ...song,
    layers: song.layers.map((layer) => {
      const adj = adjustById.get(layer.id);
      if (!adj) return layer;
      return {
        ...layer,
        busGain: adj.busGain ?? layer.busGain,
        songGain: adj.songGain ?? layer.songGain,
      };
    }),
  };
}
