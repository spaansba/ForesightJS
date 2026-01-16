import type { ForesightEvent, ForesightEventListener, ForesightEventMap } from "../types/types"

/**
 * Generic event emitter for ForesightJS events.
 * Handles event registration, removal, and emission with error handling.
 */
export class ForesightEventEmitter {
  private eventListeners: Map<ForesightEvent, ForesightEventListener[]> = new Map()

  /**
   * Add an event listener for a specific event type.
   * Supports AbortSignal for automatic cleanup.
   */
  public addEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>,
    options?: { signal?: AbortSignal }
  ): void {
    if (options?.signal?.aborted) {
      return
    }

    const listeners = this.eventListeners.get(eventType) ?? []
    listeners.push(listener as ForesightEventListener)
    this.eventListeners.set(eventType, listeners)

    options?.signal?.addEventListener("abort", () => this.removeEventListener(eventType, listener))
  }

  /**
   * Remove a previously registered event listener.
   */
  public removeEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>
  ): void {
    const listeners = this.eventListeners.get(eventType)

    if (!listeners) {
      return
    }

    const index = listeners.indexOf(listener as ForesightEventListener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * Emit an event to all registered listeners.
   * Errors in listeners are caught and logged, not propagated.
   */
  public emit<K extends ForesightEvent>(event: ForesightEventMap[K]): void {
    const listeners = this.eventListeners.get(event.type)

    if (!listeners || listeners.length === 0) {
      return
    }

    for (let i = 0; i < listeners.length; i++) {
      try {
        const listener = listeners[i]
        if (listener) {
          listener(event)
        }
      } catch (error) {
        console.error(`Error in ForesightManager event listener ${i} for ${event.type}:`, error)
      }
    }
  }

  /**
   * Check if there are any listeners registered for a specific event type.
   * Useful for avoiding expensive event object creation when no one is listening.
   */
  public hasListeners<K extends ForesightEvent>(eventType: K): boolean {
    const listeners = this.eventListeners.get(eventType)
    return listeners !== undefined && listeners.length > 0
  }

  /**
   * Get all registered event listeners (readonly).
   * Used for debugging/inspection.
   */
  public getEventListeners(): ReadonlyMap<ForesightEvent, ForesightEventListener[]> {
    return this.eventListeners
  }
}
