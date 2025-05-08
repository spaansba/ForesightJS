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

export type ForesightManagerProps = {
  positionHistorySize: number
  trajectoryPredictionTime: number
  enableMouseTrajectory: boolean
  debug: boolean
}
