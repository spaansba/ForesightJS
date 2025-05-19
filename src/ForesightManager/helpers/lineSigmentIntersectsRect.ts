import type { Point, Rect } from "../../types/types"

export function lineSegmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
  // (Liang-Barsky algorithm implementation)
  let t0 = 0.0
  let t1 = 1.0
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y

  const clipTest = (p: number, q: number): boolean => {
    if (p === 0) {
      if (q < 0) return false
    } else {
      const r = q / p
      if (p < 0) {
        if (r > t1) return false
        if (r > t0) t0 = r
      } else {
        if (r < t0) return false
        if (r < t1) t1 = r
      }
    }
    return true
  }

  if (!clipTest(-dx, p1.x - rect.left)) return false
  if (!clipTest(dx, rect.right - p1.x)) return false
  if (!clipTest(-dy, p1.y - rect.top)) return false
  if (!clipTest(dy, rect.bottom - p1.y)) return false

  return t0 <= t1
}
