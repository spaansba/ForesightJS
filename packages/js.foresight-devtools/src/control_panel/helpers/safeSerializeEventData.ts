import type {
  CallbackHitType,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerSettings,
  Point,
  UpdatedDataPropertyNames,
} from "js.foresight/types/types"
import type { HitSlop } from "packages/js.foresight/dist"

type SerializedEventType = ForesightEvent | "serializationError"

export type ControlPanelLogEntry = {
  type: ForesightEvent
  data: SerializedEventData
}

interface PayloadBase {
  type: SerializedEventType
  localizedTimestamp: string
}

interface ElementRegisteredPayload extends PayloadBase {
  type: "elementRegistered"
  name: string
  wasAlreadyRegistered: boolean
  id: string
  hitslop: HitSlop
}

// For the "elementUnregistered" case
interface ElementUnregisteredPayload extends PayloadBase {
  type: "elementUnregistered"
  name: string
  elementTag: string
  elementId: string
  elementClass: string
  isIntersecting: boolean
  hitSlop: HitSlop
  unregisterReason: string
}

// For the "elementDataUpdated" case
interface ElementDataUpdatedPayload extends PayloadBase {
  type: "elementDataUpdated"
  name: string
  elementTag: string
  updatedProps: UpdatedDataPropertyNames[] // Or string[] if that's more accurate
  isIntersecting: boolean
}

// For the "callbackFired" case
interface CallbackFiredPayload extends PayloadBase {
  type: "callbackFired"
  name: string
  elementTag: string
  hitType: CallbackHitType // Consider using a more specific type
  predictionEnabled: boolean
  tabPredictionEnabled: boolean
  scrollPredictionEnabled: boolean
}

// For the "mouseTrajectoryUpdate" case
interface MouseTrajectoryUpdatePayload extends PayloadBase {
  type: "mouseTrajectoryUpdate"
  currentPoint: Point
  predictedPoint: Point
  positionCount: number
  predictionEnabled: boolean
}

// For the "scrollTrajectoryUpdate" case
interface ScrollTrajectoryUpdatePayload extends PayloadBase {
  type: "scrollTrajectoryUpdate"
  currentPoint: Point
  predictedPoint: Point
}

// For the "managerSettingsChanged" case
interface ManagerSettingsChangedPayload extends PayloadBase {
  type: "managerSettingsChanged"
  globalSettings: ForesightManagerSettings
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
  | CallbackFiredPayload
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
          name: event.elementData?.name || "Unnamed",
          wasAlreadyRegistered: event.elementWasAlreadyRegistered,
          id: event.elementData?.element?.id || "",
          hitslop: event.elementData.elementBounds.hitSlop,
        }
      case "elementUnregistered":
        return {
          type: "elementUnregistered",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData?.name || "Unnamed",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          elementId: event.elementData?.element?.id || "",
          elementClass: event.elementData?.element?.className || "",
          isIntersecting: event.elementData?.isIntersectingWithViewport,
          hitSlop: event.elementData?.elementBounds?.hitSlop,
          unregisterReason: event.unregisterReason || undefined,
        }
      case "elementDataUpdated":
        return {
          type: "elementDataUpdated",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData?.name || "Unnamed",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          updatedProps: event.updatedProps || [],
          isIntersecting: event.elementData?.isIntersectingWithViewport,
        }
      case "callbackFired":
        return {
          type: "callbackFired",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData?.name || "Unnamed",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          hitType: event.hitType,
          predictionEnabled: event.managerData?.globalSettings?.enableMousePrediction,
          tabPredictionEnabled: event.managerData?.globalSettings?.enableTabPrediction,
          scrollPredictionEnabled: event.managerData?.globalSettings?.enableScrollPrediction,
        }
      case "mouseTrajectoryUpdate":
        return {
          type: "mouseTrajectoryUpdate",
          localizedTimestamp: new Date().toLocaleTimeString(),
          currentPoint: event.trajectoryPositions?.currentPoint,
          predictedPoint: event.trajectoryPositions?.predictedPoint,
          positionCount: event.trajectoryPositions?.positions?.length || 0,
          predictionEnabled: event.predictionEnabled,
        }
      case "scrollTrajectoryUpdate":
        return {
          type: "scrollTrajectoryUpdate",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          currentPoint: event.currentPoint,
          predictedPoint: event.predictedPoint,
        }
      case "managerSettingsChanged":
        return {
          type: "managerSettingsChanged",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          globalSettings: event.managerData?.globalSettings || {},
        }
      default:
        const _exhaustiveCheck: never = event
        return {
          type: "serializationError",
          localizedTimestamp: new Date().toLocaleTimeString(),
          error: "Failed to serialize event data",
          errorMessage: JSON.stringify(_exhaustiveCheck),
        }
    }
  } catch (error) {
    // Fallback if serialization fails
    return {
      type: "serializationError",
      error: "Failed to serialize event data",
      localizedTimestamp: new Date().toLocaleTimeString(),
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}
