import type { ForesightEvent, ForesightEventListener, ForesightEventMap } from "../types/types"

/**
 * Generic event emitter for ForesightJS events.
 * Handles event registration, removal, and emission with error handling.
 */
export class ForesightEventEmitter {
  private eventListeners: Map<ForesightEvent, Set<ForesightEventListener>> = new Map()

  public addEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>,
    options?: { signal?: AbortSignal }
  ): void {
    if (options?.signal?.aborted) {
      return
    }

    const listeners = this.eventListeners.get(eventType) ?? new Set()
    listeners.add(listener as ForesightEventListener)
    this.eventListeners.set(eventType, listeners)

    options?.signal?.addEventListener("abort", () => this.removeEventListener(eventType, listener))
  }

  public removeEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>
  ): void {
    this.eventListeners.get(eventType)?.delete(listener as ForesightEventListener)
  }

  /**
   * Emit an event to all registered listeners.
   * Errors in listeners are caught and logged, not propagated.
   */
  public emit<K extends ForesightEvent>(event: ForesightEventMap[K]): void {
    const listeners = this.eventListeners.get(event.type)

    if (!listeners || listeners.size === 0) {
      return
    }

    for (const listener of listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error(`Error in ForesightManager event listener for ${event.type}:`, error)
      }
    }
  }

  /**
   * Check if there are any listeners registered for a specific event type.
   * Useful for avoiding expensive event object creation when no one is listening.
   */
  public hasListeners<K extends ForesightEvent>(eventType: K): boolean {
    const listeners = this.eventListeners.get(eventType)

    return listeners !== undefined && listeners.size > 0
  }

  public getEventListeners(): ReadonlyMap<ForesightEvent, ReadonlySet<ForesightEventListener>> {
    return this.eventListeners
  }
}
