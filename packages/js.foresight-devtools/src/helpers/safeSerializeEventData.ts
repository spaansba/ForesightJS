import type {
  CallbackHitType,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerSettings,
  HitSlop,
  Point,
  ScrollDirection,
  UpdatedDataPropertyNames,
} from "js.foresight/types/types"
import type { UpdatedManagerSetting } from "packages/js.foresight/dist"

type SerializedEventType = ForesightEvent | "serializationError"

export type ControlPanelLogEntry = {
  eventData: SerializedEventData
}

interface PayloadBase {
  type: SerializedEventType
  localizedTimestamp: string
  summary: string // The text / data you see as preview on the right of the event (keep this short)
}

interface ElementRegisteredPayload extends PayloadBase {
  type: "elementRegistered"
  name: string
  id: string
  registerCount: number
  hitslop: HitSlop
}

interface ElementUnregisteredPayload extends PayloadBase {
  type: "elementUnregistered"
  name: string
  id: string
  registerCount: number
  unregisterReason: string
}
interface ElementDataUpdatedPayload extends PayloadBase {
  type: "elementDataUpdated"
  name: string
  updatedProps: UpdatedDataPropertyNames[]
  isIntersecting: boolean
}

interface CallbackInvokedPayload extends PayloadBase {
  type: "callbackInvoked"
  name: string
  hitType: CallbackHitType
}

interface CallbackCompletedPayload extends PayloadBase {
  type: "callbackCompleted"
  name: string
  callbackRunTimeFormatted: string
  callbackRunTimeRaw: number
  hitType: CallbackHitType
}

interface MouseTrajectoryUpdatePayload extends PayloadBase {
  type: "mouseTrajectoryUpdate"
  currentPoint: Point
  predictedPoint: Point
  positionCount: number
  mousePredictionEnabled: boolean
}

interface ScrollTrajectoryUpdatePayload extends PayloadBase {
  type: "scrollTrajectoryUpdate"
  currentPoint: Point
  predictedPoint: Point
  scrollDirection: ScrollDirection
}

interface ManagerSettingsChangedPayload extends PayloadBase {
  type: "managerSettingsChanged"
  globalSettings: ForesightManagerSettings
  settingsChanged: UpdatedManagerSetting[]
}

interface SerializationErrorPayload extends PayloadBase {
  type: "serializationError"
  error: "Failed to serialize event data"
  errorMessage: string
}

export type SerializedEventData =
  | ElementRegisteredPayload
  | ElementUnregisteredPayload
  | ElementDataUpdatedPayload
  | CallbackInvokedPayload
  | CallbackCompletedPayload
  | MouseTrajectoryUpdatePayload
  | ScrollTrajectoryUpdatePayload
  | ManagerSettingsChangedPayload
  | SerializationErrorPayload

/**
 * Safely serializes ForesightJS event data into a JSON-serializable format
 * for logging and debugging purposes.
 *
 * @param event - The ForesightJS event to serialize
 * @returns Serialized event data or error object if serialization fails
 */
export function safeSerializeEventData<K extends keyof ForesightEventMap>(
  event: ForesightEventMap[K]
): SerializedEventData {
  try {
    // For different event types, extract only the relevant serializable data
    switch (event.type) {
      case "elementRegistered":
        return {
          type: "elementRegistered",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          id: event.elementData.element.id || "",
          registerCount: event.elementData.registerCount,
          hitslop: event.elementData.elementBounds.hitSlop,
          // if its the 2nd+ time of the element registering, give the user a heads up in the summary
          summary:
            event.elementData.registerCount === 1
              ? event.elementData.name
              : `${event.elementData.name} - ${getOrdinalSuffix(
                  event.elementData.registerCount
                )} time`,
        }
      case "elementUnregistered":
        return {
          type: "elementUnregistered",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          id: event.elementData.element.id || "",
          registerCount: event.elementData.registerCount,
          unregisterReason: event.unregisterReason,
          summary: `${event.elementData.name} - ${event.unregisterReason}`,
        }
      case "elementDataUpdated":
        return {
          type: "elementDataUpdated",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          updatedProps: event.updatedProps || [],
          isIntersecting: event.elementData.isIntersectingWithViewport,
          summary: `${event.elementData.name} - ${event.updatedProps.toString()}`,
        }
      case "callbackInvoked":
        return {
          type: "callbackInvoked",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          hitType: event.hitType,
          summary: `${event.elementData.name} - ${event.hitType.kind}`,
        }
      case "callbackCompleted":
        const elapsed = formatElapsed(event.elapsed)
        return {
          type: "callbackCompleted",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          hitType: event.hitType,
          callbackRunTimeFormatted: elapsed,
          callbackRunTimeRaw: event.elapsed,
          summary: `${event.elementData.name} - ${elapsed}`,
        }
      case "mouseTrajectoryUpdate":
        return {
          type: "mouseTrajectoryUpdate",
          localizedTimestamp: new Date().toLocaleTimeString(),
          currentPoint: event.trajectoryPositions?.currentPoint,
          predictedPoint: event.trajectoryPositions?.predictedPoint,
          positionCount: event.trajectoryPositions?.positions?.length || 0,
          mousePredictionEnabled: event.predictionEnabled,
          summary: "",
        }
      case "scrollTrajectoryUpdate":
        return {
          type: "scrollTrajectoryUpdate",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          currentPoint: event.currentPoint,
          predictedPoint: event.predictedPoint,
          scrollDirection: event.scrollDirection,
          summary: event.scrollDirection,
        }
      case "managerSettingsChanged":
        return {
          type: "managerSettingsChanged",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          globalSettings: event.managerData?.globalSettings || {},
          settingsChanged: event.updatedSettings,
          summary: event.updatedSettings.map(setting => setting.setting).join(", "),
        }
      default:
        const _exhaustiveCheck: never = event
        return {
          type: "serializationError",
          localizedTimestamp: new Date().toLocaleTimeString(),
          error: "Failed to serialize event data",
          errorMessage: JSON.stringify(_exhaustiveCheck),
          summary: "",
        }
    }
  } catch (error) {
    // Fallback if serialization fails
    return {
      type: "serializationError",
      error: "Failed to serialize event data",
      localizedTimestamp: new Date().toLocaleTimeString(),
      errorMessage: error instanceof Error ? error.message : String(error),
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
function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(4)} s`
}

/**
 * Returns the ordinal suffix for a given number (e.g., "1st", "2nd", "3rd", "4th").
 *
 * @param {number} n The number to get the ordinal suffix for.
 * @returns {string} The ordinal suffix.
 */
function getOrdinalSuffix(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}
