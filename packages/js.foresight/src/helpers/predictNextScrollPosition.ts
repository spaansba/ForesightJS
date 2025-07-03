import type { Point, ScrollDirection } from "../types/types"

export function predictNextScrollPosition(
  currentPoint: Point,
  direction: ScrollDirection,
  scrollMargin: number
) {
  const { x, y } = currentPoint
  const predictedPoint = { x, y }

  switch (direction) {
    case "down":
      predictedPoint.y += scrollMargin
      break
    case "up":
      predictedPoint.y -= scrollMargin
      break
    case "left":
      predictedPoint.x -= scrollMargin
      break
    case "right":
      predictedPoint.x += scrollMargin
      break
    case "none":
      break
    default:
      direction satisfies never
  }
  return predictedPoint
}
