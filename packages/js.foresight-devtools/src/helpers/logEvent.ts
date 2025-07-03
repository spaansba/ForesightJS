import type { ForesightEvent, ForesightEventMap } from "js.foresight/types/types"

export function logEvent<K extends ForesightEvent>(
  event: ForesightEventMap[K],
  groupName: string,
  color: string
) {
  console.log(`%c${groupName}`, `color: ${color}`, event)
}
