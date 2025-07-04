import type { ForesightEvent, ForesightEventMap } from "js.foresight"

/**
 * Safely serializes ForesightJS event data into a JSON-serializable format
 * for logging and debugging purposes.
 * 
 * @param event - The ForesightJS event to serialize
 * @returns Serialized event data or error object if serialization fails
 */
export function safeSerializeEventData<K extends ForesightEvent>(event: ForesightEventMap[K]) {
  try {
    // For different event types, extract only the relevant serializable data
    switch (event.type) {
      case "elementRegistered":
        return {
          elementName: event.elementData?.name || "Unnamed Element",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          elementId: event.elementData?.element?.id || "",
          elementClass: event.elementData?.element?.className || "",
          isIntersecting: event.elementData?.isIntersectingWithViewport,
          hitSlop: event.elementData?.elementBounds?.hitSlop,
        }
      case "elementUnregistered":
        return {
          elementName: event.elementData?.name || "Unnamed Element",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          elementId: event.elementData?.element?.id || "",
          elementClass: event.elementData?.element?.className || "",
          isIntersecting: event.elementData?.isIntersectingWithViewport,
          hitSlop: event.elementData?.elementBounds?.hitSlop,
          unregisterReason: event.unregisterReason || undefined,
        }

      case "elementDataUpdated":
        return {
          elementName: event.elementData?.name || "Unnamed Element",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          updatedProps: event.updatedProps || [],
          isIntersecting: event.elementData?.isIntersectingWithViewport,
        }

      case "callbackFired":
        return {
          elementName: event.elementData?.name || "Unnamed Element",
          elementTag: event.elementData?.element?.tagName || "Unknown",
          hitType: event.hitType,
          predictionEnabled: event.managerData?.globalSettings?.enableMousePrediction,
          tabPredictionEnabled: event.managerData?.globalSettings?.enableTabPrediction,
          scrollPredictionEnabled: event.managerData?.globalSettings?.enableScrollPrediction,
        }

      case "mouseTrajectoryUpdate":
        return {
          currentPoint: event.trajectoryPositions?.currentPoint,
          predictedPoint: event.trajectoryPositions?.predictedPoint,
          positionCount: event.trajectoryPositions?.positions?.length || 0,
          predictionEnabled: event.predictionEnabled,
        }

      case "scrollTrajectoryUpdate":
        return {
          currentPoint: event.currentPoint,
          predictedPoint: event.predictedPoint,
        }

      case "managerSettingsChanged":
        return {
          globalSettings: event.managerData?.globalSettings || {},
        }

      default:
        const _exhaustiveCheck: never = event
        return {
          error: "Unhandled event type",
          eventType: JSON.stringify(_exhaustiveCheck),
        }
    }
  } catch (error) {
    // Fallback if serialization fails
    return {
      error: "Failed to serialize event data",
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}