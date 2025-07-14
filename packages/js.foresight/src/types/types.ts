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
  positions: import('../helpers/CircularBuffer').CircularBuffer<MousePosition>
  currentPoint: Point
  predictedPoint: Point
}

/**
 * Internal type representing the calculated boundaries of a foresight element,
 * including its original dimensions and the expanded hit area.
 */
export type ElementBounds = {
  /** The expanded rectangle, including hitSlop, used for interaction detection. */
  expandedRect: Readonly<Rect>
  /** The original bounding rectangle of the element, as returned by `getBoundingClientRect()`. */
  originalRect: DOMRectReadOnly
  /** The hit slop values applied to this element. */
  hitSlop: Exclude<HitSlop, number>
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
  /** Whether the user has connection limitations (slow network (2g) or data saver enabled) that should prevent prefetching */
  isLimitedConnection: boolean
  /** Whether ForesightJS will actively track this element. False if touch device or limited connection, true otherwise */
  isRegistered: boolean
  /** Function to unregister the element */
  unregister: () => void
}

/**
 * Represents the data associated with a registered foresight element.
 */
export type ForesightElementData = Required<Pick<ForesightRegisterOptions, "callback" | "name">> & {
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
   * Can be @undefined in the split second the element is registering
   */
  isIntersectingWithViewport: boolean
  /**
   * The element you registered
   */
  element: ForesightElement
  /**
   * If the element is currently running its callback
   */
  isRunningCallback: boolean
  /**
   * For debugging, check if you are registering the same element multiple times.
   */
  registerCount: number
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

export type CallbackHitType =
  | { kind: "mouse"; subType: keyof MouseCallbackCounts }
  | { kind: "tab"; subType: keyof TabCallbackCounts }
  | { kind: "scroll"; subType: keyof ScrollCallbackCounts }

/**
 * Snapshot of the current ForesightManager state
 */
export type ForesightManagerData = {
  registeredElements: ReadonlyMap<ForesightElement, ForesightElementData>
  globalSettings: Readonly<ForesightManagerSettings>
  globalCallbackHits: Readonly<CallbackHits>
  eventListeners: ReadonlyMap<keyof ForesightEventMap, ForesightEventListener[]>
  historyPositions: TrajectoryPositions
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
   *
   * @deprecated will be removed from v4.0
   * ForesightJS now have its stand-alone devtools library with the debugger built-in
   * @link https://github.com/spaansba/ForesightJS-DevTools
   */
  debug: boolean

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
  /**
   * @deprecated will be removed in V4.0
   */
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
export type ManagerBooleanSettingKeys = {
  [K in keyof UpdateForsightManagerSettings]: UpdateForsightManagerSettings[K] extends boolean
    ? K
    : never
}[keyof UpdateForsightManagerSettings]

export type NumericSettingConfig = {
  setting: NumericSettingKeys
  min: number
  max: number
}

// This map connects the string name of an event to its data type
export interface ForesightEventMap {
  elementRegistered: ElementRegisteredEvent
  elementUnregistered: ElementUnregisteredEvent
  elementDataUpdated: ElementDataUpdatedEvent
  callbackInvoked: CallbackInvokedEvent
  callbackCompleted: CallbackCompletedEvent
  mouseTrajectoryUpdate: MouseTrajectoryUpdateEvent
  scrollTrajectoryUpdate: ScrollTrajectoryUpdateEvent
  managerSettingsChanged: ManagerSettingsChangedEvent
}

export type ForesightEvent =
  | "elementRegistered"
  | "elementUnregistered"
  | "elementDataUpdated"
  | "callbackInvoked"
  | "callbackCompleted"
  | "mouseTrajectoryUpdate"
  | "scrollTrajectoryUpdate"
  | "managerSettingsChanged"

export interface ElementRegisteredEvent extends ForesightBaseEvent {
  type: "elementRegistered"
  elementData: ForesightElementData
}

export interface ElementUnregisteredEvent extends ForesightBaseEvent {
  type: "elementUnregistered"
  elementData: ForesightElementData
  unregisterReason: ElementUnregisteredReason
  wasLastElement: boolean
}

/**
 * The reason an element was unregistered from ForesightManager's tracking.
 * - `callbackHit`: The element was automatically unregistered after its callback fired.
 * - `disconnected`: The element was automatically unregistered because it was removed from the DOM.
 * - `apiCall`: The developer manually called the `unregister()` function for the element.
 */
export type ElementUnregisteredReason = "callbackHit" | "disconnected" | "apiCall"

export interface ElementDataUpdatedEvent extends Omit<ForesightBaseEvent, "timestamp"> {
  type: "elementDataUpdated"
  elementData: ForesightElementData
  updatedProps: UpdatedDataPropertyNames[]
}

export type UpdatedDataPropertyNames = "bounds" | "visibility"

export interface CallbackInvokedEvent extends ForesightBaseEvent {
  type: "callbackInvoked"
  elementData: ForesightElementData
  hitType: CallbackHitType
}

interface CallbackCompletedEventBase extends ForesightBaseEvent {
  type: "callbackCompleted"
  elementData: ForesightElementData
  hitType: CallbackHitType
  elapsed: number
}

export type CallbackCompletedEvent = CallbackCompletedEventBase &
  ({ status: "success" } | { status: "error"; errorMessage: string })

export interface MouseTrajectoryUpdateEvent extends Omit<ForesightBaseEvent, "timestamp"> {
  type: "mouseTrajectoryUpdate"
  trajectoryPositions: TrajectoryPositions
  predictionEnabled: boolean
}

export interface ScrollTrajectoryUpdateEvent extends Omit<ForesightBaseEvent, "timestamp"> {
  type: "scrollTrajectoryUpdate"
  currentPoint: Point
  predictedPoint: Point
  scrollDirection: ScrollDirection
}

export interface ManagerSettingsChangedEvent extends ForesightBaseEvent {
  type: "managerSettingsChanged"
  managerData: ForesightManagerData
  updatedSettings: UpdatedManagerSetting[]
}

export type UpdatedManagerSetting = {
  [K in keyof ForesightManagerSettings]: {
    setting: K
    newValue: ForesightManagerSettings[K]
    oldValue: ForesightManagerSettings[K]
  }
}[keyof ForesightManagerSettings]

// Event listener type
export type ForesightEventListener<K extends ForesightEvent = ForesightEvent> = (
  event: ForesightEventMap[K]
) => void

// Define the event data structures
interface ForesightBaseEvent {
  type: ForesightEvent
  timestamp: number
}
