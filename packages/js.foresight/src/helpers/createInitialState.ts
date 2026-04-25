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
  ForesightElementInternal,
  ForesightElementState,
  ForesightManagerSettings,
  ForesightRegisterOptions,
  HitSlop,
} from "../types/types"
import { getExpandedRect, normalizeHitSlop } from "./rectAndHitSlop"
import { initialViewportState } from "./initialViewportState"

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
 * Creates the internal record for a newly registered element, including the
 * initial immutable state snapshot.
 */
export function createElementInternal(
  options: ForesightRegisterOptions,
  id: string,
  defaultHitSlop: Exclude<HitSlop, number>
): ForesightElementInternal {
  const { element, callback, hitSlop, name, meta, reactivateAfter } = options

  const initialRect = element.getBoundingClientRect()
  const normalizedHitSlop = hitSlop ? normalizeHitSlop(hitSlop) : defaultHitSlop

  const state: ForesightElementState = {
    id,
    name: name || element.id || "unnamed",
    meta: meta ?? {},
    elementBounds: {
      originalRect: initialRect,
      expandedRect: getExpandedRect(initialRect, normalizedHitSlop),
      hitSlop: normalizedHitSlop,
    },
    isIntersectingWithViewport: initialViewportState(initialRect),
    isRegistered: true,
    isActive: true,
    isPredicted: false,
    hitCount: 0,
    lastInvokedAt: undefined,
    lastCompletedAt: undefined,
    lastDurationMs: undefined,
    lastStatus: undefined,
    lastError: null,
    reactivateAfter: reactivateAfter ?? DEFAULT_STALE_TIME,
  }

  return {
    state,
    element,
    callback,
    registerCount: 1,
    reactivateTimeoutId: undefined,
    subscribers: new Set(),
  }
}
