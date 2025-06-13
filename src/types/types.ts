import type { PositionObserverEntry } from "position-observer"

export type Rect = {
  top: number
  left: number
  right: number
  bottom: number
}

/**
 * A callback function that is executed when a foresight interaction
 * (e.g., hover, trajectory hit) occurs on a registered element.
 */
export type ForesightCallback = () => void

/**
 * Represents the HTML element that is being tracked by the ForesightManager.
 * This is typically a standard DOM `Element`.
 */
export type ForesightElement = Element

/**
 * Represents a mouse position captured at a specific point in time.
 * Used for tracking mouse movement history.
 */
export type MousePosition = {
  /** The (x, y) coordinates of the mouse. */
  point: Point
  /** The timestamp (e.g., from `performance.now()`) when this position was recorded. */
  time: number
}

export type Point = {
  x: number
  y: number
}

export type TrajectoryPositions = {
  positions: MousePosition[]
  currentPoint: Point
  predictedPoint: Point
}

/**
 * Internal type representing the calculated boundaries of a foresight element,
 * including its original dimensions and the expanded hit area.
 */
export type ElementBounds = {
  /** The expanded rectangle, including hitSlop, used for interaction detection. */
  expandedRect: Rect
  /** The original bounding rectangle of the element, as returned by `getBoundingClientRect()`. */
  originalRect?: DOMRectReadOnly
  /** The hit slop values applied to this element. */
  hitSlop: Exclude<HitSlop, number>
}

export type DebuggerSettings = {
  /** If the control panel should be minimized on default @default false */
  isControlPanelDefaultMinimized?: boolean
  /** If we should show the name tags above elements @default false */
  showNameTags?: boolean
}

/**
 * Represents trajectory hit related data for a foresight element.
 */
export type TrajectoryHitData = {
  /** True if the predicted mouse trajectory has intersected the element's expanded bounds. */
  isTrajectoryHit: boolean
  /** The timestamp when the last trajectory hit occurred. */
  trajectoryHitTime: number
  /** Timeout ID for expiring the trajectory hit state. */
  trajectoryHitExpirationTimeoutId?: ReturnType<typeof setTimeout>
}

export type ForesightRegisterResult = {
  /** Whether the current device is a touch device. This is important as ForesightJS only works based on cursor movement. If the user is using a touch device you should handle prefetching differently  */
  isTouchDevice: boolean
  /** Function to unregister the element, optional to add the elementdata */
  unregister: () => void
}

/**
 * Represents the data associated with a registered foresight element.
 */
export type ForesightElementData = Required<
  Pick<ForesightRegisterOptions, "callback" | "unregisterOnCallback" | "name">
> & {
  /** The boundary information for the element. */
  elementBounds: ElementBounds
  /** True if the mouse cursor is currently hovering over the element's expanded bounds. */
  isHovering: boolean
  /**
   * Represents trajectory hit related data for a foresight element. Only used for the manager
   */
  trajectoryHitData: TrajectoryHitData
  /**
   * Is the element intersecting with the viewport, usefull to track which element we should observe or not
   */
  isIntersectingWithViewport: boolean
  /**
   * Amount of times this callback has been hit, will be 0/1 if unregisterOnCallback is true
   */
  callbackHits: CallbackHits
  /**
   * The element you registered
   */
  element: ForesightElement
}

export type MouseCallbackCounts = {
  hover: number
  trajectory: number
}

export type TabCallbackCounts = {
  reverse: number
  forwards: number
}

export type ScrollDirection = "down" | "up" | "left" | "right" | "none"
export type ScrollCallbackCounts = Record<`${Exclude<ScrollDirection, "none">}`, number>

export type CallbackHits = {
  total: number
  mouse: MouseCallbackCounts
  tab: TabCallbackCounts
  scroll: ScrollCallbackCounts
}

export type HitType =
  | { kind: "mouse"; subType: keyof MouseCallbackCounts }
  | { kind: "tab"; subType: keyof TabCallbackCounts }
  | { kind: "scroll"; subType: keyof ScrollCallbackCounts }

/**
 * Snapshot of the current ForesightManager state
 */
export type ForesightManagerData = {
  registeredElements: Map<ForesightElement, ForesightElementData>
  globalSettings: Readonly<ForesightManagerSettings>
  globalCallbackHits: Readonly<CallbackHits>
  positionObserverElements: Map<Element, PositionObserverEntry> | undefined
}

type BaseForesightManagerSettings = {
  /**
   * Number of mouse positions to keep in history for trajectory calculation.
   * A higher number might lead to smoother but slightly delayed predictions.
   *
   *
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   *
   *
   * **This value is clamped between 2 and 30.**
   * @default 8
   */
  positionHistorySize: number

  /**
   * How far ahead (in milliseconds) to predict the mouse trajectory.
   * A larger value means the prediction extends further into the future. (meaning it will trigger callbacks sooner)
   *
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   *
   * **This value is clamped between 10 and 200.**
   * @default 120
   */
  trajectoryPredictionTime: number

  /**
   * Whether to enable mouse trajectory prediction.
   * If false, only direct hover/interaction is considered.
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   * @default true
   */
  enableMousePrediction: boolean

  /**
   * Toggles whether keyboard prediction is on
   *
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   * @default true
   */
  enableTabPrediction: boolean

  /**
   * Sets the pixel distance to check from the mouse position in the scroll direction.
   *
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   *
   * **This value is clamped between 30 and 300.**
   * @default 150
   */
  scrollMargin: number

  /**
   * Toggles whether scroll prediction is on
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   * @default true
   */
  enableScrollPrediction: boolean

  /**
   * Tab stops away from an element to trigger callback. Only works when @argument enableTabPrediction is true
   *
   * **This value is clamped between 0 and 20.**
   * @default 2
   */
  tabOffset: number

  /**
   * Whether to show visual debugging information on the screen.
   * This includes overlays for elements, hit slop areas, the predicted mouse path and a debug control panel.
   * @default false
   */
  debug: boolean

  /**
   * @deprecated This property will be removed in v3.0.0. Use automatic optimization instead.
   */
  resizeScrollThrottleDelay: number

  /** Options for the debugger */
  debuggerSettings: DebuggerSettings

  /**
   * A global callback that runs whenever a callback is fired for any
   * registered element, just after the element's specific callback is fired.
   *
   * @param elementData - The ForesightTarget object for the element that triggered the event.
   * @param managerData - Data about the ForesightManager
   */
  onAnyCallbackFired: (elementData: ForesightElementData, managerData: ForesightManagerData) => void
}

/**
 * Configuration options for the ForesightManager
 * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
 */
export type ForesightManagerSettings = BaseForesightManagerSettings & {
  defaultHitSlop: Exclude<HitSlop, number>
}

/**
 * Update options for the ForesightManager
 * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
 */
export type UpdateForsightManagerSettings = BaseForesightManagerSettings & {
  defaultHitSlop: HitSlop
}

/**
 * Type used to register elements to the foresight manager
 */
export type ForesightRegisterOptions = {
  element: ForesightElement
  callback: ForesightCallback
  hitSlop?: HitSlop
  unregisterOnCallback?: boolean
  name?: string
}

/**
 * Usefull for if you want to create a custom button component in a modern framework (for example React).
 * And you want to have the ForesightRegisterOptions used in ForesightManager.instance.register({})
 * without the element as the element will be the ref of the component.
 *
 * @link https://foresightjs.com/docs/getting_started/typescript#foresightregisteroptionswithoutelement
 */
export type ForesightRegisterOptionsWithoutElement = Omit<ForesightRegisterOptions, "element">

/**
 * Fully invisible "slop" around the element.
 * Basically increases the hover hitbox
 */
export type HitSlop = Rect | number

/**
 * Get all keys in UpdateForsightManagerSettings that are numeric
 */
export type NumericSettingKeys = {
  [K in keyof UpdateForsightManagerSettings]: UpdateForsightManagerSettings[K] extends number
    ? K
    : never
}[keyof UpdateForsightManagerSettings]

/**
 * Get all keys in UpdateForsightManagerSettings that are boolean
 */
export type BooleanSettingKeys = {
  [K in keyof UpdateForsightManagerSettings]: UpdateForsightManagerSettings[K] extends boolean
    ? K
    : never
}[keyof UpdateForsightManagerSettings]
