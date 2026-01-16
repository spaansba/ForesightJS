import {
  DEFAULT_ENABLE_MOUSE_PREDICTION,
  DEFAULT_ENABLE_SCROLL_PREDICTION,
  DEFAULT_ENABLE_TAB_PREDICTION,
  DEFAULT_HITSLOP,
  DEFAULT_POSITION_HISTORY_SIZE,
  DEFAULT_SCROLL_MARGIN,
  DEFAULT_STALE_TIME,
  DEFAULT_TAB_OFFSET,
  DEFAULT_TRAJECTORY_PREDICTION_TIME,
} from "../constants"
import type {
  CallbackHits,
  ForesightElementData,
  ForesightManagerSettings,
  ForesightRegisterOptions,
  HitSlop,
} from "../types/types"
import { getExpandedRect, normalizeHitSlop } from "./rectAndHitSlop"
import { initialViewportState } from "./initialViewportState"

/**
 * Creates the initial callback hits tracking object with all counters at zero.
 */
export function createInitialCallbackHits(): CallbackHits {
  return {
    mouse: {
      hover: 0,
      trajectory: 0,
    },
    tab: {
      forwards: 0,
      reverse: 0,
    },
    scroll: {
      down: 0,
      left: 0,
      right: 0,
      up: 0,
    },
    touch: 0,
    viewport: 0,
    total: 0,
  }
}

/**
 * Creates the default manager settings object.
 */
export function createDefaultSettings(): ForesightManagerSettings {
  return {
    debug: false,
    enableManagerLogging: false,
    enableMousePrediction: DEFAULT_ENABLE_MOUSE_PREDICTION,
    enableScrollPrediction: DEFAULT_ENABLE_SCROLL_PREDICTION,
    positionHistorySize: DEFAULT_POSITION_HISTORY_SIZE,
    trajectoryPredictionTime: DEFAULT_TRAJECTORY_PREDICTION_TIME,
    scrollMargin: DEFAULT_SCROLL_MARGIN,
    defaultHitSlop: {
      top: DEFAULT_HITSLOP,
      left: DEFAULT_HITSLOP,
      right: DEFAULT_HITSLOP,
      bottom: DEFAULT_HITSLOP,
    },
    enableTabPrediction: DEFAULT_ENABLE_TAB_PREDICTION,
    tabOffset: DEFAULT_TAB_OFFSET,
    touchDeviceStrategy: "onTouchStart",
    minimumConnectionType: "3g",
  }
}

/**
 * Creates element data from registration options.
 * This encapsulates all the logic for setting up a new registered element.
 */
export function createElementData(
  options: ForesightRegisterOptions,
  id: string,
  defaultHitSlop: Exclude<HitSlop, number>
): ForesightElementData {
  const { element, callback, hitSlop, name, meta, reactivateAfter } = options

  const initialRect = element.getBoundingClientRect()
  const normalizedHitSlop = hitSlop ? normalizeHitSlop(hitSlop) : defaultHitSlop

  return {
    id,
    element,
    callback,
    elementBounds: {
      originalRect: initialRect,
      expandedRect: getExpandedRect(initialRect, normalizedHitSlop),
      hitSlop: normalizedHitSlop,
    },
    name: name || element.id || "unnamed",
    isIntersectingWithViewport: initialViewportState(initialRect),
    registerCount: 1,
    meta: meta ?? {},
    callbackInfo: {
      callbackFiredCount: 0,
      lastCallbackInvokedAt: undefined,
      lastCallbackCompletedAt: undefined,
      lastCallbackRuntime: undefined,
      lastCallbackStatus: undefined,
      lastCallbackErrorMessage: undefined,
      reactivateAfter: reactivateAfter ?? DEFAULT_STALE_TIME,
      isCallbackActive: true,
      isRunningCallback: false,
      reactivateTimeoutId: undefined,
    },
  }
}
