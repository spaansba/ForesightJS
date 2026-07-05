import { effect, inject, isSignal, type Signal } from "@angular/core"
import type { ForesightEvent, ForesightEventMap } from "js.foresight"
import { ForesightService } from "../services/ForesightService"

type MaybeSignal<T> = T | Signal<T>

const read = <T>(value: MaybeSignal<T>): T => (isSignal(value) ? (value() as T) : (value as T))

/**
 * Subscribes to a ForesightManager event for the lifetime of the current
 * injection context. Pass signals when the event type or listener must change
 * over time; plain values are intentionally treated as static. A changed event
 * type re-subscribes, a changed listener is picked up on the next event without
 * re-subscribing.
 */
export const injectForesightEvent = <K extends ForesightEvent>(
  eventType: MaybeSignal<K>,
  listener: MaybeSignal<(event: ForesightEventMap[K]) => void>
): void => {
  const foresight = inject(ForesightService)

  effect(onCleanup => {
    const unsubscribe = foresight.listen(read(eventType), event => read(listener)(event))

    onCleanup(unsubscribe)
  })
}
