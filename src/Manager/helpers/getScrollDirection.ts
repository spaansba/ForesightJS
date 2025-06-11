import type { Rect, ScrollDirection } from "../../types/types"

export function getScrollDirection(oldRect: Rect, newRect: Rect): ScrollDirection {
  const scrollThreshold = 1
  const deltaY = newRect.top - oldRect!.top
  const deltaX = newRect.left - oldRect!.left
  if (deltaY > scrollThreshold) {
    return "up"
  } else if (deltaY < -scrollThreshold) {
    return "down"
  }
  if (deltaX > scrollThreshold) {
    return "left"
  } else if (deltaX < -scrollThreshold) {
    return "right"
  }
  return "none"
}
