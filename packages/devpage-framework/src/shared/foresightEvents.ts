import type {
  ForesightEvent,
  ForesightEventMap,
  ForesightElementState,
  CallbackHitType,
} from "js.foresight"

export type EventLogEntry = {
  id: number
  type: ForesightEvent
  timestamp: number
  summary: string
}

export const MAX_LOG_ENTRIES = 200

export const ALL_EVENTS: ForesightEvent[] = [
  "elementRegistered",
  "elementUnregistered",
  "callbackInvoked",
  "callbackCompleted",
  "managerSettingsChanged",
  "deviceStrategyChanged",
]

export const EVENT_COLORS: Partial<Record<ForesightEvent, string>> = {
  elementRegistered: "text-green-700",
  elementUnregistered: "text-red-700",
  callbackInvoked: "text-amber-700",
  callbackCompleted: "text-purple-700",
  managerSettingsChanged: "text-cyan-700",
  deviceStrategyChanged: "text-teal-700",
}

export const formatHitType = (hitType: CallbackHitType): string => {
  return hitType.subType ? `${hitType.kind}:${hitType.subType}` : hitType.kind
}

export const formatElementName = (state: ForesightElementState): string => {
  return state.name || state.id.slice(0, 8)
}

export const summarizeEvent = (event: ForesightEventMap[ForesightEvent]): string => {
  switch (event.type) {
    case "elementRegistered":
      return `"${formatElementName(event.state)}" registered`

    case "elementUnregistered":
      return `"${formatElementName(event.state)}" unregistered (${event.unregisterReason})`

    case "callbackInvoked":
      return `"${formatElementName(event.state)}" callback invoked [${formatHitType(event.hitType)}]`

    case "callbackCompleted":
      return `"${formatElementName(event.state)}" callback ${event.status ?? "done"} (${event.elapsed.toFixed(1)}ms) [${formatHitType(event.hitType)}]`

    case "managerSettingsChanged":
      return `settings changed: ${event.updatedSettings.map(s => s.setting).join(", ")}`

    case "deviceStrategyChanged":
      return `device strategy: ${event.oldStrategy} -> ${event.newStrategy}`

    default:
      return event.type
  }
}
