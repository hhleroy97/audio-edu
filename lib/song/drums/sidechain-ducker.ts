import type { SidechainDefType } from "@/lib/schemas/drums";
import type { MasterBus } from "../multibus/master-bus";

/** Schedules gain dips on layer duck nodes when kick fires. */
export class SidechainDucker {
  private config: SidechainDefType | null = null;

  constructor(private readonly bus: MasterBus) {}

  setConfig(config: SidechainDefType | null): void {
    this.config = config;
  }

  /** Duck target layers from a kick hit at `atTime`. */
  triggerKick(atTime: number): void {
    if (!this.config) return;
    const { depth, attackSec, releaseSec, targetLayers } = this.config;
    for (const layerId of targetLayers) {
      this.bus.scheduleSidechainDuck(layerId, atTime, depth, attackSec, releaseSec);
    }
  }
}
