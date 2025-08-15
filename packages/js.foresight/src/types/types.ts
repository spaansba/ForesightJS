import type { CircularBuffer } from "../helpers/CircularBuffer"

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
  positions: CircularBuffer<MousePosition>
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

export type ForesightRegisterResult = {
  /** Whether the current device is a touch device. This is important as ForesightJS only works based on cursor movement. If the user is using a touch device you should handle prefetching differently
   * @deprecated As of version 3.3, ForesightJS handles touch devices internally with dedicated touch strategies
   */
  isTouchDevice: boolean
  /** Whether the user has connection limitations (slow network (2g) or data saver enabled) that should prevent prefetching */
  isLimitedConnection: boolean
  /** Whether ForesightJS will actively track this element. False if touch device or limited connection, true otherwise */
  isRegistered: boolean
  /** Function to unregister the element
   * @deprecated no longer need to call this manually, you can call Foresightmanager.instance.unregister if needed
   */
  unregister: () => void
}

/**
 * Represents the data associated with a registered foresight element.
 */
export type ForesightElementData = Required<
  Pick<ForesightRegisterOptions, "callback" | "name" | "meta">
> & {
  /** Unique identifier assigned during registration */
  id: string
  /** The boundary information for the element. */
  elementBounds: ElementBounds
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
   * For debugging, check if you are registering the same element multiple times.
   */
  registerCount: number
  /**
   * Callbackinfo for debugging purposes
   */
  callbackInfo: ElementCallbackInfo
}

export type ElementCallbackInfo = {
  /**
   * Number of times the callback has been fired for this element
   */
  callbackFiredCount: number
  /**
   * Timestamp when the callback was last fired
   */
  lastCallbackInvokedAt: number | undefined
  /**
   * Timestamp when the last callback was finished
   */
  lastCallbackCompletedAt: number | undefined
  /**
   * Time in milliseconds it took for the last callback to go from invoked to complete.
   */
  lastCallbackRuntime: number | undefined
  /**
   * Status of the last ran callback
   */
  lastCallbackStatus: callbackStatus
  /**
   * Last callback error message
   */
  lastCallbackErrorMessage: string | undefined | null
  /**
   * Time in milliseconds after which the callback can be fired again
   */
  reactivateAfter: number
  /**
   * Whether the callback is currently active (within stale time period)
   */
  isCallbackActive: boolean
  /**
   * If the element is currently running its callback
   */
  isRunningCallback: boolean
  /**
   * Timeout ID for the scheduled reactivation, if any
   */
  reactivateTimeoutId?: ReturnType<typeof setTimeout>
}

export type callbackStatus = "error" | "success" | undefined

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
  touch: number
  viewport: number
}

export type CallbackHitType =
  | { kind: "mouse"; subType: keyof MouseCallbackCounts }
  | { kind: "tab"; subType: keyof TabCallbackCounts }
  | { kind: "scroll"; subType: keyof ScrollCallbackCounts }
  | { kind: "touch"; subType?: string }
  | { kind: "viewport"; subType?: string }

/**
 * Snapshot of the current ForesightManager state
 */
export type ForesightManagerData = {
  registeredElements: ReadonlyMap<ForesightElement, ForesightElementData>
  globalSettings: Readonly<ForesightManagerSettings>
  globalCallbackHits: Readonly<CallbackHits>
  eventListeners: ReadonlyMap<keyof ForesightEventMap, ForesightEventListener[]>
  currentDeviceStrategy: CurrentDeviceStrategy
  activeElementCount: number
}

export type TouchDeviceStrategy = "none" | "viewport" | "onTouchStart"

/**
 * Network effective connection types that can be considered limited
 * @link https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
 */
export type MinimumConnectionType = "slow-2g" | "2g" | "3g" | "4g"

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
   *
   * Logs basic information about the ForesightManager and its handlers that doesn't have a dedicated event.
   *
   * Mostly used by the maintainers of ForesightJS to debug the manager. But might be useful for implementers aswell.
   *
   * This is not the same as logging events, this can be done with the actual developer tools.
   * @link https://foresightjs.com/docs/debugging/devtools
   */
  enableManagerLogging: boolean
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
   * The prefetch strategy used for touch devices.
   * - `viewport`: Prefetching is done based on the viewport, meaning elements in the viewport are preloaded.
   * - `onTouchStart`: Prefetching is done when the user touches the element
   * @default onTouchStart
   */
  touchDeviceStrategy: TouchDeviceStrategy

  /**
   * Network effective connection types that should be considered as limited connections.
   * When the user's network matches any of these types, ForesightJS will disable prefetching
   * to avoid consuming data on slow or expensive connections.
   * 
   * @link https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
   * @default 2g
   */
  minimumConnectionType: MinimumConnectionType
}

export type CurrentDeviceStrategy = "mouse" | "touch" | "pen"

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
  /**
   * If set by user, stores additional information about the registered element
   */
  meta?: Record<string, unknown>
  /**
   * Time in milliseconds after which the callback can be fired again and we reactivate the element.
   * Set to Infinity to prevent callback from firing again after first execution.
   * @default Infinity
   */
  reactivateAfter?: number
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
  elementReactivated: ElementReactivatedEvent
  elementUnregistered: ElementUnregisteredEvent
  elementDataUpdated: ElementDataUpdatedEvent
  callbackInvoked: CallbackInvokedEvent
  callbackCompleted: CallbackCompletedEvent
  mouseTrajectoryUpdate: MouseTrajectoryUpdateEvent
  scrollTrajectoryUpdate: ScrollTrajectoryUpdateEvent
  managerSettingsChanged: ManagerSettingsChangedEvent
  deviceStrategyChanged: DeviceStrategyChangedEvent
}

export type ForesightEvent =
  | "elementRegistered"
  | "elementReactivated"
  | "elementUnregistered"
  | "elementDataUpdated"
  | "callbackInvoked"
  | "callbackCompleted"
  | "mouseTrajectoryUpdate"
  | "scrollTrajectoryUpdate"
  | "managerSettingsChanged"
  | "deviceStrategyChanged"

export interface DeviceStrategyChangedEvent extends ForesightBaseEvent {
  type: "deviceStrategyChanged"
  newStrategy: CurrentDeviceStrategy
  oldStrategy: CurrentDeviceStrategy
}

export interface ElementRegisteredEvent extends ForesightBaseEvent {
  type: "elementRegistered"
  elementData: ForesightElementData
}

export interface ElementReactivatedEvent extends ForesightBaseEvent {
  type: "elementReactivated"
  elementData: ForesightElementData
}

export interface ElementUnregisteredEvent extends ForesightBaseEvent {
  type: "elementUnregistered"
  elementData: ForesightElementData
  unregisterReason: ElementUnregisteredReason
  wasLastRegisteredElement: boolean
}

/**
 * The reason an element was unregistered from ForesightManager's tracking.
 * - `callbackHit`: The element was automatically unregistered after its callback fired.
 * - `disconnected`: The element was automatically unregistered because it was removed from the DOM.
 * - `apiCall`: The developer manually called the `unregister()` function for the element.
 * - `devtools`: When clicking the trash icon in the devtools element tab
 * - any other string
 */
export type ElementUnregisteredReason = "disconnected" | "apiCall" | "devtools" | (string & {})

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
  wasLastActiveElement: boolean
}

export type CallbackCompletedEvent = CallbackCompletedEventBase & {
  status: callbackStatus
  errorMessage: string | undefined | null
}

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
