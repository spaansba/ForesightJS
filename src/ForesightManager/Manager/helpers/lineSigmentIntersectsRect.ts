import type { Point, Rect } from "../../../types/types"

/**
 * Determines if a line segment intersects with a given rectangle.
 * This function implements the Liang-Barsky line clipping algorithm.
 *
 * @param p1 - The starting {@link Point} of the line segment.
 * @param p2 - The ending {@link Point} of the line segment.
 * @param rect - The {@link Rect} to check for intersection.
 * @returns `true` if the line segment intersects the rectangle, `false` otherwise.
 */
export function lineSegmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
  let t0 = 0.0
  let t1 = 1.0
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y

  const clipTest = (p: number, q: number): boolean => {
    if (p === 0) {
      // Line is parallel to this clipping edge
      if (q < 0) return false // Line is outside the clipping edge
    } else {
      const r = q / p
      if (p < 0) {
        // Line proceeds from outside to inside
        if (r > t1) return false // Line segment ends before crossing edge
        if (r > t0) t0 = r // Update entry point
      } else {
        // Line proceeds from inside to outside
        if (r < t0) return false // Line segment starts after crossing edge
        if (r < t1) t1 = r // Update exit point
      }
    }
    return true
  }

  // Clip against all four edges of the rectangle
  if (!clipTest(-dx, p1.x - rect.left)) return false // Left edge
  if (!clipTest(dx, rect.right - p1.x)) return false // Right edge
  if (!clipTest(-dy, p1.y - rect.top)) return false // Top edge
  if (!clipTest(dy, rect.bottom - p1.y)) return false // Bottom edge

  // If t0 <= t1, the line segment intersects the rectangle (or lies within it)
  return t0 <= t1
}
