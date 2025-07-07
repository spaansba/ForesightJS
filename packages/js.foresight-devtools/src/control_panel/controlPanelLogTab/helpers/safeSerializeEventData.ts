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
  wasAlreadyRegistered: boolean
  hitslop: HitSlop
}

interface ElementUnregisteredPayload extends PayloadBase {
  type: "elementUnregistered"
  name: string
  id: string
  unregisterReason: string
}
interface ElementDataUpdatedPayload extends PayloadBase {
  type: "elementDataUpdated"
  name: string
  elementTag: string
  updatedProps: UpdatedDataPropertyNames[]
  isIntersecting: boolean
}

interface CallbackInvokedPayload extends PayloadBase {
  type: "callbackInvoked"
  name: string
  elementTag: string
  hitType: CallbackHitType
  predictionEnabled: boolean
  tabPredictionEnabled: boolean
  scrollPredictionEnabled: boolean
}

interface CallbackCompletedPayload extends PayloadBase {
  type: "callbackCompleted"
  name: string
  elementTag: string
  callbackRunTime: number
  hitType: CallbackHitType
  predictionEnabled: boolean
  tabPredictionEnabled: boolean
  scrollPredictionEnabled: boolean
}

interface MouseTrajectoryUpdatePayload extends PayloadBase {
  type: "mouseTrajectoryUpdate"
  currentPoint: Point
  predictedPoint: Point
  positionCount: number
  predictionEnabled: boolean
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
          wasAlreadyRegistered: event.elementWasAlreadyRegistered,
          id: event.elementData?.element?.id || "",
          hitslop: event.elementData.elementBounds.hitSlop,
          summary: event.elementData.name,
        }
      case "elementUnregistered":
        return {
          type: "elementUnregistered",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          id: event.elementData?.element?.id || "",
          unregisterReason: event.unregisterReason,
          summary: event.unregisterReason,
        }
      case "elementDataUpdated":
        return {
          type: "elementDataUpdated",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          elementTag: event.elementData?.element?.tagName || "Unknown",
          updatedProps: event.updatedProps || [],
          isIntersecting: event.elementData?.isIntersectingWithViewport,
          summary: event.updatedProps.toString(),
        }
      case "callbackInvoked":
        return {
          type: "callbackInvoked",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          elementTag: event.elementData?.element?.tagName || "Unknown",
          hitType: event.hitType,
          predictionEnabled: event.managerData?.globalSettings?.enableMousePrediction,
          tabPredictionEnabled: event.managerData?.globalSettings?.enableTabPrediction,
          scrollPredictionEnabled: event.managerData?.globalSettings?.enableScrollPrediction,
          summary: event.hitType.kind,
        }
      case "callbackCompleted":
        return {
          type: "callbackCompleted",
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          name: event.elementData.name,
          elementTag: event.elementData?.element?.tagName || "Unknown",
          hitType: event.hitType,
          predictionEnabled: event.managerData?.globalSettings?.enableMousePrediction,
          tabPredictionEnabled: event.managerData?.globalSettings?.enableTabPrediction,
          scrollPredictionEnabled: event.managerData?.globalSettings?.enableScrollPrediction,
          callbackRunTime: event.elapsed,
          summary: event.hitType.kind,
        }
      case "mouseTrajectoryUpdate":
        return {
          type: "mouseTrajectoryUpdate",
          localizedTimestamp: new Date().toLocaleTimeString(),
          currentPoint: event.trajectoryPositions?.currentPoint,
          predictedPoint: event.trajectoryPositions?.predictedPoint,
          positionCount: event.trajectoryPositions?.positions?.length || 0,
          predictionEnabled: event.predictionEnabled,
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
          summary: "",
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
