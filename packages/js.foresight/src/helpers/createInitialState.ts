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

export const createInitialCallbackHits = (): CallbackHits => {
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

export const createDefaultManagerSettings = (): ForesightManagerSettings => {
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
export const createElementInternal = (
  options: ForesightRegisterOptions,
  id: string,
  defaultHitSlop: Exclude<HitSlop, number>
): ForesightElementInternal => {
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
    isLimitedConnection: false,
    isIntersectingWithViewport: initialViewportState(initialRect),
    isRegistered: true,
    isActive: true,
    isPredicted: false,
    isCallbackRunning: false,
    hitCount: 0,
    registerCount: 1,
    durationMs: undefined,
    status: undefined,
    error: null,
    reactivateAfter: reactivateAfter ?? DEFAULT_STALE_TIME,
  }

  return {
    state,
    invokedAt: undefined,
    completedAt: undefined,
    element,
    callback,
    reactivateTimeoutId: undefined,
    subscribers: new Set(),
  }
}

// new DOMRectReadOnly(0, 0, 0, 0) doesn't work in ssr, so we use this constant instead
const EMPTY_DOM_RECT: DOMRectReadOnly = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON: () => ({}),
}

/**
 * Snapshot of the flat state shape for an element that is not (yet) tracked by the
 * manager. Reuses the same fields as a registered element so consumers don't need
 * to special-case `null`.
 *
 * Used in two situations:
 * 1. The manager refuses to register the element (touch device, limited connection,
 *    etc.) — pass `isLimitedConnection` to reflect that.
 * 2. Framework wrappers (React, Vue) need an initial snapshot before `register()`
 *    has run. `register()` requires a real DOM element, which only exists after
 *    the consumer's first render commits, so the wrapper returns this snapshot
 *    during that brief window. Pass `isLimitedConnection: false` for this case.
 */
export const createUnregisteredSnapshot = (isLimitedConnection: boolean): ForesightElementState => {
  return {
    id: "",
    name: "",
    meta: {},
    elementBounds: {
      originalRect: EMPTY_DOM_RECT,
      expandedRect: { top: 0, left: 0, right: 0, bottom: 0 },
      hitSlop: { top: 0, left: 0, right: 0, bottom: 0 },
    },
    isLimitedConnection,
    isIntersectingWithViewport: false,
    isRegistered: false,
    isActive: false,
    isPredicted: false,
    isCallbackRunning: false,
    hitCount: 0,
    registerCount: 0,
    durationMs: undefined,
    status: undefined,
    error: null,
    reactivateAfter: DEFAULT_STALE_TIME,
  }
}
