import type { Rect, ScrollDirection } from "../types/types"

export function getScrollDirection(oldRect: Rect, newRect: Rect): ScrollDirection {
  const scrollThreshold = 1
  const deltaY = newRect.top - oldRect.top
  const deltaX = newRect.left - oldRect.left

  // Check vertical scroll first (most common)
  if (deltaY < -scrollThreshold) {
    return "down" // Element moved up in viewport = scrolled down
  } else if (deltaY > scrollThreshold) {
    return "up" // Element moved down in viewport = scrolled up
  }

  // Check horizontal scroll
  if (deltaX < -scrollThreshold) {
    return "right" // Element moved left in viewport = scrolled right
  } else if (deltaX > scrollThreshold) {
    return "left" // Element moved right in viewport = scrolled left
  }

  return "none" // No significant movement detected
}
