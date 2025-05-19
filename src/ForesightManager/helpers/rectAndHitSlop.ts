import type { HitSlop, Point, Rect } from "../../types/types"

/**
 * Normalizes a `hitSlop` value into a {@link Rect} object.
 * If `hitSlop` is a number, it's applied uniformly to all sides (top, left, right, bottom).
 * If `hitSlop` is already a `Rect` object, it's returned as is.
 *
 * @param hitSlop - A number for uniform slop, or a {@link Rect} object for specific slop per side.
 * @returns A {@link Rect} object with `top`, `left`, `right`, and `bottom` properties.
 */
export function normalizeHitSlop(hitSlop: HitSlop): Rect {
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

/**
 * Calculates an expanded rectangle by applying a `hitSlop` to a base rectangle.
 * The `hitSlop` values define how much to extend each side of the `baseRect` outwards.
 *
 * @param baseRect - The original {@link Rect} or `DOMRect` to expand.
 * @param hitSlop - A {@link Rect} object defining how much to expand each side
 *                  (e.g., `hitSlop.left` expands the left boundary further to the left).
 * @returns A new {@link Rect} object representing the expanded area.
 */
export function getExpandedRect(baseRect: Rect | DOMRect, hitSlop: Rect): Rect {
  return {
    left: baseRect.left - hitSlop.left,
    right: baseRect.right + hitSlop.right,
    top: baseRect.top - hitSlop.top,
    bottom: baseRect.bottom + hitSlop.bottom,
  }
}

/**
 * Checks if two rectangle objects are equal by comparing their respective
 * `top`, `left`, `right`, and `bottom` properties.
 * Handles cases where one or both rects might be null or undefined.
 *
 * @param rect1 - The first {@link Rect} object to compare.
 * @param rect2 - The second {@link Rect} object to compare.
 * @returns `true` if the rectangles have identical dimensions or if both are null/undefined,
 *          `false` otherwise.
 */
export function areRectsEqual(rect1: Rect, rect2: Rect): boolean {
  if (!rect1 || !rect2) return rect1 === rect2
  return (
    rect1.left === rect2.left &&
    rect1.right === rect2.right &&
    rect1.top === rect2.top &&
    rect1.bottom === rect2.bottom
  )
}

export function isPointInRectangle(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  )
}
