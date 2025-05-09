export type Rect = {
  top: number
  left: number
  right: number
  bottom: number
}

/**
 * A callback function that is executed when a foresight interaction
 * (e.g., hover, trajectory hit) occurs on a registered element.
 * Only triggers ones per interaction
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

/**
 * Represents a 2D point with x and y coordinates.
 */
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

/**
 * Represents the data associated with a registered foresight element.
 * This includes its callback, boundary information, and current interaction state.
 */
export type ElementData = {
  /** The callback function to execute on interaction. */
  callback: ForesightCallback
  /** The boundary information for the element. */
  elementBounds: ElementBounds
  /** True if the mouse cursor is currently hovering over the element's expanded bounds. */
  isHovering: boolean
  /** True if the predicted mouse trajectory has intersected the element's expanded bounds. */
  isTrajectoryHit: boolean
  /** The timestamp when the last trajectory hit occurred. */
  trajectoryHitTime: number
}

/**
 * Configuration options for the ForesightManager
 */
export type ForesightManagerProps = {
  /**
   * Number of mouse positions to keep in history for trajectory calculation.
   * A higher number might lead to smoother but slightly delayed predictions.
   * @default 6
   */
  positionHistorySize: number

  /**
   * How far ahead (in milliseconds) to predict the mouse trajectory.
   * A larger value means the prediction extends further into the future. (meaning it will trigger callbacks sooner)
   * @default 50
   */
  trajectoryPredictionTime: number

  /**
   * Whether to enable mouse trajectory prediction.
   * If false, only direct hover/interaction is considered.
   * @default true
   */
  enableMouseTrajectory: boolean

  /**
   * Whether to show visual debugging information on the screen.
   * This includes overlays for elements, hit slop areas, and the predicted mouse path.
   * @default false
   */
  debug: boolean

  /**
   * Default hit slop to apply to all registered elements if no specific
   * hit slop is provided during registration.
   * Can be a single number for uniform slop on all sides, or a Rect object
   * for different values per side.
   * @default { top: 0, left: 0, right: 0, bottom: 0 }
   */
  defaultHitSlop: Rect | number
}
