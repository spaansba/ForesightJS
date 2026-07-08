import type { Point, ScrollDirection } from "../types/types"

export const predictNextScrollPosition = (
  currentPoint: Point,
  direction: ScrollDirection,
  scrollMargin: number,
  out: Point
): void => {
  out.x = currentPoint.x
  out.y = currentPoint.y

  switch (direction) {
    case "down":
      out.y += scrollMargin
      break
    case "up":
      out.y -= scrollMargin
      break
    case "left":
      out.x -= scrollMargin
      break
    case "right":
      out.x += scrollMargin
      break
    case "none":
      break
    default:
      direction satisfies never
  }
}
