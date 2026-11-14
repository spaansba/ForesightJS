import { ForesightManager, type ForesightEvent, type ForesightEventMap } from "js.foresight"

/** Subscribe during component initialization; automatically cleaned up on destroy. */
export const onForesightEvent = <K extends ForesightEvent>(
  type: K,
  listener: (event: ForesightEventMap[K]) => void
): void => {
  $effect(() => {
    const controller = new AbortController()
    ForesightManager.instance.addEventListener(type, listener, { signal: controller.signal })

    return () => controller.abort()
  })
}
