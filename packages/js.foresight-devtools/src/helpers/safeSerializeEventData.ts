import type {
  CallbackHits,
  CallbackHitType,
  ElementCallbackInfo,
  ForesightElementData,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerData,
  ForesightManagerSettings,
  HitSlop,
  Point,
  ScrollDirection,
  UpdatedDataPropertyNames,
  UpdatedManagerSetting,
} from "js.foresight/types/types"

type SerializedEventType = ForesightEvent | "serializationError" | "managerDataPayload"

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
  callbackInfo: ElementCallbackInfo
  hitslop: HitSlop
  meta: Record<string, unknown>
}

interface ElementUnregisteredEvent extends PayloadBase {
  type: "elementUnregistered"
}

interface ElementReactivatedPayload extends PayloadBase {
  type: "elementReactivated"
  name: string
  id: string
  callbackInfo: ElementCallbackInfo
  meta: Record<string, unknown>
}

interface ElementDataUpdatedPayload extends PayloadBase {
  type: "elementDataUpdated"
  name: string
  updatedProps: UpdatedDataPropertyNames[]
  callbackInfo: ElementCallbackInfo
  isIntersecting: boolean
  meta: Record<string, unknown>
}

interface CallbackInvokedPayload extends PayloadBase {
  type: "callbackInvoked"
  name: string
  hitType: CallbackHitType
  callbackInfo: ElementCallbackInfo
  meta: Record<string, unknown>
}

interface CallbackCompletedPayload extends PayloadBase {
  type: "callbackCompleted"
  name: string
  hitType: CallbackHitType
  status: "success" | "error" | undefined
  errorMessage: string | undefined | null
  callbackInfo: ElementCallbackInfo
  meta: Record<string, unknown>
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

interface ManagerDataPayload extends PayloadBase {
  type: "managerDataPayload"
  warning: string
  globalCallbackHits: CallbackHits
  eventListenerCount: Record<string, number>
  managerSettings: ForesightManagerSettings
  registeredElements: Array<Omit<ForesightElementData, "element"> & { elementInfo: string }>
}

export type SerializedEventData =
  | ElementRegisteredPayload
  | ElementUnregisteredEvent
  | ElementReactivatedPayload
  | ElementDataUpdatedPayload
  | CallbackInvokedPayload
  | CallbackCompletedPayload
  | MouseTrajectoryUpdatePayload
  | ScrollTrajectoryUpdatePayload
  | ManagerSettingsChangedPayload
  | ManagerDataPayload
  | SerializationErrorPayload

export function safeSerializeManagerData(
  data: ForesightManagerData,
  logId: string
): ManagerDataPayload {
  const eventListeners: Record<string, number> = {}
  data.eventListeners.forEach((listeners, eventType) => {
    eventListeners[eventType] = listeners.length
  })
  const registeredElements: Array<Omit<ForesightElementData, "element"> & { elementInfo: string }> =
    []
  data.registeredElements.forEach((elementData, element) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { element: _, ...elementDataWithoutElement } = elementData
    registeredElements.push({
      ...elementDataWithoutElement,
      elementInfo: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${
        element.className ? `.${element.className.replace(/\s+/g, ".")}` : ""
      }`,
    })
  })

  return {
    type: "managerDataPayload",
    warning: "this is a lot easier to view in the console",
    logId: logId,
    globalCallbackHits: data.globalCallbackHits,
    localizedTimestamp: new Date().toLocaleTimeString(),
    eventListenerCount: eventListeners,
    managerSettings: data.globalSettings,
    registeredElements: registeredElements,
    summary: `${registeredElements.length} elements, ${
      Object.values(eventListeners).flat().length
    } listeners,
  ${data.globalCallbackHits.total} hits`,
  }
}

/**
 * Safely serializes ForesightJS event data into a JSON-serializable format
 * for logging and debugging purposes.
 *
 * @param event - The ForesightJS event to serialize
 * @returns Serialized event data or error object if serialization fails
 */
export function safeSerializeEventData<K extends keyof ForesightEventMap>(
  event: ForesightEventMap[K],
  logId: string
): SerializedEventData {
  try {
    // For different event types, extract only the relevant serializable data
    switch (event.type) {
      case "elementRegistered":
        return {
          type: "elementRegistered",
          name: event.elementData.name,
          id: event.elementData.element.id || "",
          callbackInfo: event.elementData.callbackInfo,
          hitslop: event.elementData.elementBounds.hitSlop,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          meta: event.elementData.meta,
          // if its the 2nd+ time of the element registering, give the user a heads up in the summary
          logId: logId,
          summary:
            event.elementData.registerCount === 1
              ? event.elementData.name
              : `${event.elementData.name} - ${getOrdinalSuffix(
                  event.elementData.registerCount
                )} time`,
        }
      case "elementReactivated":
        return {
          type: "elementReactivated",
          name: event.elementData.name,
          id: event.elementData.element.id || "",
          callbackInfo: event.elementData.callbackInfo,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          meta: event.elementData.meta,
          // if its the 2nd+ time of the element registering, give the user a heads up in the summary
          logId: logId,
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
          // name: event.elementData.name,
          // id: event.elementData.element.id || "",
          // meta: event.elementData.meta,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          summary: `${event.elementData.name} - ${event.unregisterReason}`,
        }
      case "elementDataUpdated":
        return {
          type: "elementDataUpdated",
          name: event.elementData.name,
          updatedProps: event.updatedProps || [],
          callbackInfo: event.elementData.callbackInfo,
          isIntersecting: event.elementData.isIntersectingWithViewport,
          meta: event.elementData.meta,
          localizedTimestamp: new Date().toLocaleTimeString(),
          logId: logId,
          summary: `${event.elementData.name} - ${event.updatedProps.toString()}`,
        }
      case "callbackInvoked":
        return {
          type: "callbackInvoked",
          name: event.elementData.name,
          hitType: event.hitType,
          callbackInfo: event.elementData.callbackInfo,
          meta: event.elementData.meta,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          summary: `${event.elementData.name} - ${event.hitType.kind}`,
        }
      case "callbackCompleted": {
        const elapsed = formatElapsed(event.elapsed)
        return {
          type: "callbackCompleted",
          name: event.elementData.name,
          hitType: event.hitType,
          callbackInfo: event.elementData.callbackInfo,
          meta: event.elementData.meta,
          localizedTimestamp: new Date(event.timestamp).toLocaleTimeString(),
          logId: logId,
          status: event.elementData.callbackInfo.lastCallbackStatus,
          errorMessage: event.elementData.callbackInfo.lastCallbackErrorMessage,
          summary: `${event.elementData.name} - ${elapsed}`,
        }
      }
      case "mouseTrajectoryUpdate":
        return {
          type: "mouseTrajectoryUpdate",
          currentPoint: event.trajectoryPositions?.currentPoint,
          predictedPoint: event.trajectoryPositions?.predictedPoint,
          positionCount: event.trajectoryPositions?.positions?.length || 0,
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
