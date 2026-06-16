/** Poll AudioParam.value for live mod preview on CV targets. */
export type ModPreviewKey = `${string}:${string}`;

export class ModPreviewBus {
  private params = new Map<ModPreviewKey, AudioParam>();
  private listeners = new Set<() => void>();
  private rafId: number | null = null;

  register(nodeId: string, handle: string, param: AudioParam): void {
    this.params.set(`${nodeId}:${handle}`, param);
  }

  unregister(nodeId: string, handle: string): void {
    this.params.delete(`${nodeId}:${handle}`);
    if (this.params.size === 0) this.stopLoop();
  }

  clear(): void {
    this.params.clear();
    this.stopLoop();
  }

  getValue(nodeId: string, handle: string): number | undefined {
    return this.params.get(`${nodeId}:${handle}`)?.value;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    this.ensureLoop();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopLoop();
    };
  }

  private ensureLoop(): void {
    if (this.rafId !== null || this.listeners.size === 0) return;
    if (typeof requestAnimationFrame !== "function") return;
    const tick = () => {
      for (const listener of this.listeners) listener();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
