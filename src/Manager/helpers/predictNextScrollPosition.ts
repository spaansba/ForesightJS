import type { Point, ScrollDirection } from "../../types/types"

export function predictNextScrollPosition(currentPoint: Point, direction: ScrollDirection) {
  const { x, y } = currentPoint
  const predictionDistance = 150
  const predictedPoint = { x, y }

  switch (direction) {
    case "down":
      predictedPoint.y += predictionDistance
      break
    case "up":
      predictedPoint.y -= predictionDistance
      break
    case "left":
      predictedPoint.x -= predictionDistance
      break
    case "right":
      predictedPoint.x += predictionDistance
      break
  }
  return predictedPoint
}
