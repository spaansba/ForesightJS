export type Rect = {
  top: number
  left: number
  right: number
  bottom: number
}

export type ForesightCallback = () => void

export type ForesightElement = Element

export type MousePosition = {
  point: Point
  time: number
}

export type Point = {
  x: number
  y: number
}

type ElementBounds = {
  expandedRect: Rect
  originalRect: DOMRect
  hitSlop: Rect
}

export type ElementData = {
  callback: ForesightCallback
  elementBounds: ElementBounds
  isHovering: boolean
  isTrajectoryHit: boolean
  trajectoryHitTime: number
}

/**
 * Configuration options for the ForesightManager
 */
export type ForesightManagerProps = {
  positionHistorySize: number // Number of mouse positions to keep in history
  trajectoryPredictionTime: number // How far ahead (ms) to predict mouse trajectory
  enableMouseTrajectory: boolean // Whether to enable trajectory prediction
  debug: boolean // Whether to show debug information
  defaultHitSlop: Rect | number // Default hit slop to apply to all elements
}
