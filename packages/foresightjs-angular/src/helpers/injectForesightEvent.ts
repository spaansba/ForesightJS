import { DestroyRef, effect, inject, isSignal, type Signal } from "@angular/core"
import type { ForesightEvent, ForesightEventMap } from "js.foresight"
import { ForesightService } from "../services/ForesightService"

type EventTypeInput<K extends ForesightEvent> = K | Signal<K>
type ListenerInput<K extends ForesightEvent> =
  | ((event: ForesightEventMap[K]) => void)
  | Signal<(event: ForesightEventMap[K]) => void>

const resolveEventType = <K extends ForesightEvent>(eventType: EventTypeInput<K>): K => {
  if (isSignal(eventType)) {
    return eventType()
  }

  return eventType
}

const resolveListener = <K extends ForesightEvent>(
  listener: ListenerInput<K>
): ((event: ForesightEventMap[K]) => void) => {
  if (isSignal(listener)) {
    return listener() as (event: ForesightEventMap[K]) => void
  }

  return listener as (event: ForesightEventMap[K]) => void
}

/**
 * Subscribes to a ForesightManager event for the lifetime of the current
 * injection context. Pass signals when the event type or listener must change
 * over time; plain values are intentionally treated as static.
 */
export const injectForesightEvent = <K extends ForesightEvent>(
  eventType: EventTypeInput<K>,
  listener: ListenerInput<K>
): void => {
  const destroyRef = inject(DestroyRef)
  const foresight = inject(ForesightService)

  const effectRef = effect(onCleanup => {
    const unsubscribe = foresight.listen(resolveEventType(eventType), event =>
      resolveListener(listener)(event)
    )

    onCleanup(unsubscribe)
  })

  destroyRef.onDestroy(() => effectRef.destroy())
}
