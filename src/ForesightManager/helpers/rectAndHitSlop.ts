import type { Rect } from "../../types/types"

export function normalizeHitSlop(hitSlop: number | Rect): Rect {
  if (typeof hitSlop === "number") {
    return {
      top: hitSlop,
      left: hitSlop,
      right: hitSlop,
      bottom: hitSlop,
    }
  }
  return hitSlop
}

export function getExpandedRect(baseRect: Rect | DOMRect, hitSlop: Rect): Rect {
  return {
    left: baseRect.left - hitSlop.left,
    right: baseRect.right + hitSlop.right,
    top: baseRect.top - hitSlop.top,
    bottom: baseRect.bottom + hitSlop.bottom,
  }
}

export function areRectsEqual(rect1: Rect, rect2: Rect): boolean {
  if (!rect1 || !rect2) return rect1 === rect2
  return (
    rect1.left === rect2.left &&
    rect1.right === rect2.right &&
    rect1.top === rect2.top &&
    rect1.bottom === rect2.bottom
  )
}
