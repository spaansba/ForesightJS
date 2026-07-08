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
export type ForesightCallback = (state: ForesightElementState) => void

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
 * Immutable geometry snapshot for a registered element. Replaced (never mutated)
 * whenever the element's position or size changes, which happens on every
 * scroll/resize tick for visible elements.
 */
export type ElementBounds = {
  /** The expanded rectangle, including hitSlop, used for interaction detection. */
  expandedRect: Readonly<Rect>
  /** The original bounding rectangle of the element, as returned by `getBoundingClientRect()`. */
  originalRect: DOMRectReadOnly
}

/**
 * Immutable, flat state snapshot for a registered element.
 * The reference is replaced (never mutated) on every change so it can be used
 * with `useSyncExternalStore` and Vue's `shallowRef`.
 */
export type ForesightElementState = {
  /** Unique identifier assigned during registration. */
  id: string
  /** Human-readable name for debugging. */
  name: string
  /** Arbitrary user-supplied metadata. */
  meta: Record<string, unknown>
  /** The normalized hit slop applied to this element. The element's rects live in
   * {@link ElementBounds} (see `getBounds`/`subscribeToBounds`), not in this snapshot. */
  hitSlop: Exclude<HitSlop, number>
  /** Whether the user has connection limitations (network slower than minimum connection type (default: 3g) or data saver enabled) that prevent prefetching. */
  isLimitedConnection: boolean
  /** Whether the element is currently intersecting the viewport. */
  isIntersectingWithViewport: boolean
  /** Whether the element is currently tracked by the manager. Stays `true` from
   * registration until it is explicitly unregistered (via the returned `unregister`).
   * Detaching the element from the DOM does NOT unregister it - it is parked inactive
   * and resumes when it reconnects. On a limited connection it is also registered but
   * inactive - check `isLimitedConnection` / `isActive`. */
  isRegistered: boolean
  /** Whether the element is currently eligible to fire its callback. False when the
   * element is disabled (`isEnabled: false`), on a limited connection, or temporarily
   * detached from the DOM (see `isParked`). */
  isActive: boolean
  /** Whether the element is detached from the DOM and parked: kept registered but
   * inactive until it reconnects, at which point it resumes automatically. */
  isParked: boolean
  /** Whether prediction is enabled for this element. When `false` the element
   * stays registered but inactive. Note: an enabled element is still inactive on a
   * limited connection (see `isLimitedConnection`). */
  isEnabled: boolean
  /** True once the element's callback has been triggered by a prediction hit. Stays true until the element is reactivated or unregistered. */
  isPredicted: boolean
  /** True while the callback is executing (between invocation and completion). The callback is awaited, so this stays true for async callbacks until they resolve or reject. */
  isCallbackRunning: boolean
  /** Number of times the callback has fired for this element. */
  hitCount: number
  /** Number of times this element has been (re)registered. */
  registerCount: number
  /** Duration in ms of the most recent callback run. */
  durationMs: number | undefined
  /** Status of the most recently completed callback. */
  status: callbackStatus
  /** Error message from the most recently completed callback. */
  error: string | null
  /** Time in ms after which the callback can be fired again (Infinity = never). */
  reactivateAfter: number
}

export type ForesightRegisterResult = ForesightElementState & {
  /** Function to unregister the element
   */
  unregister: () => void
  /**
   * Subscribe to logical state changes for this element. Never fires for
   * geometry-only changes (scroll/resize), use `subscribeToBounds` for those.
   * Returns an unsubscribe function.
   */
  subscribe: (listener: () => void) => () => void
  /**
   * Returns the current immutable state snapshot for this element.
   * The reference only changes when logical state changes - never on scroll.
   */
  getSnapshot: () => ForesightElementState
  /**
   * Subscribe to geometry changes for this element (position/size, fired on
   * every scroll/resize tick while visible). Returns an unsubscribe function.
   */
  subscribeToBounds: (listener: () => void) => () => void
  /**
   * Returns the current immutable geometry snapshot for this element.
   */
  getBounds: () => ElementBounds
}

/**
 * Manager-internal record. Holds the public state ref plus internal-only fields.
 * Not exposed to consumers.
 */
export type ForesightElementInternal = {
  /** Current immutable public state ref. Replaced on every logical change. */
  state: ForesightElementState
  /** Current immutable geometry ref. Replaced on every position/size change. */
  bounds: ElementBounds
  /** Timestamp the callback was last invoked. */
  invokedAt: number | undefined
  /** Timestamp the callback last completed. */
  completedAt: number | undefined
  /** The DOM element this record tracks. */
  element: ForesightElement
  /** User-supplied callback. */
  callback: ForesightCallback
  /** Pending reactivation timer, if any. */
  reactivateTimeoutId?: ReturnType<typeof setTimeout>
  /** Listeners notified whenever `state` is replaced. */
  subscribers: Set<() => void>
  /** Listeners notified whenever `bounds` is replaced. */
  boundsSubscribers: Set<() => void>
}

export type callbackStatus = "error" | "success" | undefined

type MouseCallbackCounts = {
  hover: number
  trajectory: number
}

type TabCallbackCounts = {
  reverse: number
  forwards: number
}

export type ScrollDirection = "down" | "up" | "left" | "right" | "none"
type ScrollCallbackCounts = Record<`${Exclude<ScrollDirection, "none">}`, number>

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
  registeredElements: ReadonlyMap<ForesightElement, ForesightElementState>
  globalSettings: Readonly<ForesightManagerSettings>
  globalCallbackHits: Readonly<CallbackHits>
  eventListeners: ReadonlyMap<keyof ForesightEventMap, ReadonlySet<ForesightEventListener>>
  currentDeviceStrategy: CurrentDeviceStrategy
  activeElementCount: number
  parkedElementCount: number
  loadedModules: ForesightModules
}

export type ForesightModules = {
  desktopHandler: boolean
  touchHandler: boolean
  predictors: {
    mouse: boolean
    tab: boolean
    scroll: boolean
    viewport: boolean
    touchStart: boolean
  }
}

export type TouchDeviceStrategy = "none" | "viewport" | "onTouchStart"
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
   * @default 3g
   */
  minimumConnectionType: MinimumConnectionType

  /**
   * When `true` the manager mirrors every registered element's prediction state
   * onto `data-*` attributes via direct DOM mutation, so plain CSS can style
   * predictions without any framework re-render. Toggling this applies or
   * removes the attributes on all currently-registered elements.
   *  - `data-predicted` — present while `isPredicted` is `true`
   *  - `data-active` — present while `isActive` is `true`
   *  - `data-callback-running` — present while `isCallbackRunning` is `true`
   *  - `data-status` — set to `"success"` or `"error"` once a callback completes
   *
   * @link https://foresightjs.com/docs/getting_started/config#available-global-settings
   * @default true
   */
  setDataAttributes: boolean
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
export type ForesightRegisterOptions = ForesightRegisterOptionsWithoutElement & {
  element: ForesightElement
}

export type ForesightRegisterNodeListOptions = ForesightRegisterOptionsWithoutElement & {
  element: NodeListOf<ForesightElement>
}

/**
 * Use full for if you want to create a custom button component in a modern framework (for example React).
 * And you want to have the ForesightRegisterOptions used in ForesightManager.instance.register({})
 * without the element as the element will be the ref of the component.
 *
 * @link https://foresightjs.com/docs/getting_started/typescript#foresightregisteroptionswithoutelement
 */
export type ForesightRegisterOptionsWithoutElement = {
  callback: ForesightCallback
  hitSlop?: HitSlop
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
  /**
   * When `false` the element stays registered but inactive: excluded from
   * prediction and never fires its callback.
   * @default true
   */
  enabled?: boolean
}

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

// This map connects the string name of an event to its data type
export interface ForesightEventMap {
  elementRegistered: ElementRegisteredEvent
  elementUnregistered: ElementUnregisteredEvent
  callbackInvoked: CallbackInvokedEvent
  callbackCompleted: CallbackCompletedEvent
  mouseTrajectoryUpdate: MouseTrajectoryUpdateEvent
  scrollTrajectoryUpdate: ScrollTrajectoryUpdateEvent
  managerSettingsChanged: ManagerSettingsChangedEvent
  deviceStrategyChanged: DeviceStrategyChangedEvent
}

export type ForesightEvent = keyof ForesightEventMap

export interface DeviceStrategyChangedEvent extends ForesightBaseEvent {
  type: "deviceStrategyChanged"
  newStrategy: CurrentDeviceStrategy
  oldStrategy: CurrentDeviceStrategy
}

export interface ElementRegisteredEvent extends ForesightBaseEvent {
  type: "elementRegistered"
  element: ForesightElement
  state: ForesightElementState
}

export interface ElementUnregisteredEvent extends ForesightBaseEvent {
  type: "elementUnregistered"
  element: ForesightElement
  state: ForesightElementState
  unregisterReason: ElementUnregisteredReason
  wasLastRegisteredElement: boolean
}

/**
 * The reason an element was unregistered from ForesightManager's tracking.
 * - `callbackHit`: The element was automatically unregistered after its callback fired.
 * - `disconnected`: No longer emitted. Elements detached from the DOM are now parked
 *   (kept registered but inactive) and resumed on reconnect, rather than unregistered.
 * - `apiCall`: The developer manually called the `unregister()` function for the element.
 * - `devtools`: When clicking the trash icon in the devtools element tab
 * - any other string
 */
export type ElementUnregisteredReason = "disconnected" | "apiCall" | "devtools" | (string & {})

export interface CallbackInvokedEvent extends ForesightBaseEvent {
  type: "callbackInvoked"
  element: ForesightElement
  state: ForesightElementState
  hitType: CallbackHitType
}

interface CallbackCompletedEventBase extends ForesightBaseEvent {
  type: "callbackCompleted"
  element: ForesightElement
  state: ForesightElementState
  hitType: CallbackHitType
  elapsed: number
  wasLastActiveElement: boolean
}

export type CallbackCompletedEvent = CallbackCompletedEventBase & {
  status: callbackStatus
  errorMessage: string | null
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
