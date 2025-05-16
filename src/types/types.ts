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

/**
 * Internal type representing the calculated boundaries of a foresight element,
 * including its original dimensions and the expanded hit area.
 * (This type is not exported, but commenting it is good practice for maintainability)
 */
type ElementBounds = {
  /** The expanded rectangle, including hitSlop, used for interaction detection. */
  expandedRect: Rect
  /** The original bounding rectangle of the element, as returned by `getBoundingClientRect()`. */
  originalRect: DOMRect
  /** The hit slop values applied to this element. */
  hitSlop: Rect
}

export type DebuggerSettings = {
  /** If the control panel should be minimized on default @default false */
  isControlPanelDefaultMinimized?: boolean
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
  /** Function to unregister the element */
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
   * Represents trajectory hit related data for a foresight element.
   */
  trajectoryHitData: TrajectoryHitData
}

type BaseForesightManagerProps = {
  /**
   * Number of mouse positions to keep in history for trajectory calculation.
   * A higher number might lead to smoother but slightly delayed predictions.
   * @default 8
   */
  positionHistorySize: number

  /**
   * How far ahead (in milliseconds) to predict the mouse trajectory.
   * A larger value means the prediction extends further into the future. (meaning it will trigger callbacks sooner)
   * @default 80
   */
  trajectoryPredictionTime: number

  /**
   * Whether to enable mouse trajectory prediction.
   * If false, only direct hover/interaction is considered.
   * @default true
   */
  enableMousePrediction: boolean

  /**
   * Whether to show visual debugging information on the screen.
   * This includes overlays for elements, hit slop areas, and the predicted mouse path.
   * @default false
   */
  debug: boolean

  /**
   * Amount of time in ms the element bounds get recalculated on scroll/resize of the page.
   * @default 50
   */
  resizeScrollThrottleDelay: number

  /** Options for the debugger */
  debuggerSettings: DebuggerSettings
}

/**
 * Configuration options for the ForesightManager
 */
export type ForesightManagerProps = BaseForesightManagerProps & {
  defaultHitSlop: Rect
}

export type UpdateForsightManagerProps = BaseForesightManagerProps & {
  defaultHitSlop: Rect | number
}

export type ForesightRegisterOptions = {
  element: ForesightElement
  callback: ForesightCallback
  hitSlop?: Rect | number
  unregisterOnCallback?: boolean
  name?: string
}

export type ForesightRegisterOptionsWithoutElement = Omit<ForesightRegisterOptions, "element">
