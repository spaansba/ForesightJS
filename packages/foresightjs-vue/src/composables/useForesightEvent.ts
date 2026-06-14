import { watch, toValue, onScopeDispose, isRef, type MaybeRef, type MaybeRefOrGetter } from "vue"
import { ForesightManager, type ForesightEvent, type ForesightEventMap } from "js.foresight"

type ListenerArg<K extends ForesightEvent> = MaybeRef<(event: ForesightEventMap[K]) => void>

/**
 * Subscribes to a ForesightManager event for the lifetime of the calling scope.
 *
 * The listener is always invoked with its latest reference - no stale closures
 * when passed as a `ref()`. Changing `eventType` automatically tears down the
 * previous subscription and creates a new one; changing only the `listener`
 * does not re-subscribe.
 */
export const useForesightEvent = <K extends ForesightEvent>(
  eventType: MaybeRefOrGetter<K>,
  listener: ListenerArg<K>
): void => {
  let controller: AbortController | null = null

  const resolveListener = isRef(listener) ? () => listener.value : () => listener

  const subscribe = (type: K) => {
    // No-op during SSR: `watch(immediate)` runs in setup on the server, but the
    // ForesightManager singleton (and its listeners) belong on the client only.
    if (typeof document === "undefined") {
      return
    }

    controller?.abort()
    controller = new AbortController()

    const stableListener = (event: ForesightEventMap[K]) => resolveListener()(event)

    ForesightManager.instance.addEventListener(type, stableListener, {
      signal: controller.signal,
    })
  }

  watch(
    () => toValue(eventType),
    newType => subscribe(newType),
    { immediate: true }
  )

  onScopeDispose(() => {
    controller?.abort()
    controller = null
  })
}
