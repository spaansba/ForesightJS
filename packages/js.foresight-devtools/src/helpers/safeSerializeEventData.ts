import type {
  CallbackHitType,
  ForesightElementState,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightMeta,
  HitSlop,
  ForesightPoint,
  ScrollDirection,
  UpdatedManagerSetting,
} from "js.foresight"
import type { CallbackHits } from "./callbackHits"

export type SerializedEventType = ForesightEvent | "serializationError" | "managerDataPayload"

export type ControlPanelLogEntry = {
  eventData: SerializedEventData
}

interface PayloadBase {
  type: SerializedEventType
  localizedTimestamp: string
  summary: string // The text / data you see as preview on the right of the event (keep this short)
  logId: string
}

interface ElementRegisteredPayload extends PayloadBase {
  type: "elementRegistered"
  name: string
  id: string
  state: ForesightElementState
  hitslop: HitSlop
  meta: ForesightMeta
}

interface ElementUnregisteredEvent extends PayloadBase {
  type: "elementUnregistered"
  name: string
  id: string
  state: ForesightElementState
  meta: ForesightMeta
  wasLastRegisteredElement: boolean
}

interface CallbackInvokedPayload extends PayloadBase {
  type: "callbackInvoked"
  name: string
  hitType: CallbackHitType
  state: ForesightElementState
  meta: ForesightMeta
}

interface CallbackCompletedPayload extends PayloadBase {
  type: "callbackCompleted"
  elapsed: string
  name: string
  hitType: CallbackHitType
  status: "success" | "error" | undefined
  errorMessage: string | undefined | null
  state: ForesightElementState
  wasLastActiveElement: boolean
  meta: ForesightMeta
}

interface MouseTrajectoryUpdatePayload extends PayloadBase {
  type: "mouseTrajectoryUpdate"
  currentPoint: ForesightPoint
  predictedPoint: ForesightPoint
  mousePredictionEnabled: boolean
}

interface ScrollTrajectoryUpdatePayload extends PayloadBase {
  type: "scrollTrajectoryUpdate"
  currentPoint: ForesightPoint
  predictedPoint: ForesightPoint
  scrollDirection: ScrollDirection
}

interface ManagerSettingsChangedPayload extends PayloadBase {
  type: "managerSettingsChanged"
  globalSettings: ForesightManagerSettings
  settingsChanged: UpdatedManagerSetting[]
}

interface DeviceStrategyChangedPayload extends PayloadBase {
  type: "deviceStrategyChanged"
  oldStrategy: string
  newStrategy: string
}

interface SerializationErrorPayload extends PayloadBase {
  type: "serializationError"
  error: "Failed to serialize event data"
  errorMessage: string
}

interface ManagerDataPayload extends PayloadBase {
  type: "managerDataPayload"
  warning: string
  globalCallbackHits: CallbackHits
  managerSettings: ForesightManagerSettings
  registeredElements: Array<ForesightElementState & { elementInfo: string }>
}

export type SerializedEventData =
  | ElementRegisteredPayload
  | ElementUnregisteredEvent
  | CallbackInvokedPayload
  | CallbackCompletedPayload
  | MouseTrajectoryUpdatePayload
  | ScrollTrajectoryUpdatePayload
  | ManagerSettingsChangedPayload
  | DeviceStrategyChangedPayload
  | ManagerDataPayload
  | SerializationErrorPayload

export const safeSerializeManagerData = (
  data: ForesightManagerData,
  callbackHits: CallbackHits,
  logId: string
): ManagerDataPayload => {
  const registeredElements: Array<ForesightElementState & { elementInfo: string }> = []
  data.registeredElements.forEach((state, element) => {
    registeredElements.push({
      ...state,
      elementInfo: `${element.id ? `#${element.id}` : ""}${
        element.className ? `.${element.className.replace(/\s+/g, ".")}` : ""
      }`,
    })
  })

  return {
    type: "managerDataPayload",
    warning: "this is a lot easier to view in the console",
    logId: logId,
    globalCallbackHits: callbackHits,
    localizedTimestamp: new Date().toLocaleTimeString(),
    managerSettings: data.globalSettings,
    registeredElements: registeredElements,
    summary: `${registeredElements.length} elements, ${callbackHits.total} hits`,
  }
}

/**
 * Safely serializes ForesightJS event data into a JSON-serializable format
 * for logging and debugging purposes.
 *
 * @param event - The ForesightJS event to serialize
 * @returns Serialized event data or error object if serialization fails
 */
export const safeSerializeEventData = <K extends keyof ForesightEventMap>(
  event: ForesightEventMap[K],
  logId: string
): SerializedEventData => {
  try {
    // For different event types, extract only the relevant serializable data
    switch (event.type) {
      case "elementRegistered":
        return {
          type: "elementRegistered",
          name: event.state.name,
          id: event.element.id || "",
          state: event.state,
          hitslop: event.state.hitSlop,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          meta: event.state.meta,
          logId: logId,
          summary: event.state.name,
        }
      case "elementUnregistered":
        return {
          type: "elementUnregistered",
          name: event.state.name,
          id: event.element.id || "",
          meta: event.state.meta,
          state: event.state,
          wasLastRegisteredElement: event.wasLastRegisteredElement,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          summary: `${event.state.name} - ${event.unregisterReason}`,
        }
      case "callbackInvoked":
        return {
          type: "callbackInvoked",
          name: event.state.name,
          hitType: event.hitType,
          state: event.state,
          meta: event.state.meta,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          summary: `${event.state.name} - ${event.hitType.kind}`,
        }
      case "callbackCompleted": {
        const elapsed = formatElapsed(event.state.durationMs || 0)

        return {
          type: "callbackCompleted",
          name: event.state.name,
          hitType: event.hitType,
          state: event.state,
          meta: event.state.meta,
          wasLastActiveElement: event.wasLastActiveElement,
          elapsed: elapsed,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          status: event.state.status,
          errorMessage: event.state.error,
          summary: `${event.state.name} - ${elapsed}`,
        }
      }
      case "mouseTrajectoryUpdate":
        return {
          type: "mouseTrajectoryUpdate",
          currentPoint: event.trajectoryPositions?.currentPoint,
          predictedPoint: event.trajectoryPositions?.predictedPoint,
          mousePredictionEnabled: event.predictionEnabled,
          localizedTimestamp: new Date().toLocaleTimeString(),
          logId: logId,
          summary: "",
        }
      case "scrollTrajectoryUpdate":
        return {
          type: "scrollTrajectoryUpdate",
          currentPoint: event.currentPoint,
          predictedPoint: event.predictedPoint,
          scrollDirection: event.scrollDirection,
          localizedTimestamp: new Date().toLocaleTimeString(),
          logId: logId,
          summary: event.scrollDirection,
        }
      case "managerSettingsChanged":
        return {
          type: "managerSettingsChanged",
          globalSettings: event.managerData?.globalSettings || {},
          settingsChanged: event.updatedSettings,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          summary: event.updatedSettings.map(setting => setting.setting).join(", "),
        }
      case "deviceStrategyChanged":
        return {
          type: "deviceStrategyChanged",
          oldStrategy: event.oldStrategy,
          newStrategy: event.newStrategy,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          summary: `${event.oldStrategy} → ${event.newStrategy}`,
        }
      default: {
        const _exhaustiveCheck: never = event

        return {
          type: "serializationError",
          error: "Failed to serialize event data",
          errorMessage: JSON.stringify(_exhaustiveCheck),
          localizedTimestamp: new Date().toLocaleTimeString(),
          logId: logId,
          summary: "",
        }
      }
    }
  } catch (error) {
    // Fallback if serialization fails
    return {
      type: "serializationError",
      error: "Failed to serialize event data",
      localizedTimestamp: new Date().toLocaleTimeString(),
      errorMessage: error instanceof Error ? error.message : String(error),
      logId: logId,
      summary: "",
    }
  }
}

/**
 * Formats a duration in milliseconds into seconds.
 *
 * @param {number} ms  Duration in milliseconds
 * @returns {string}   Duration in seconds, e.g. “0.50 s” or “1.23 s”
 */
const formatElapsed = (ms: number): string => {
  return `${(ms / 1000).toFixed(4)} s`
}
