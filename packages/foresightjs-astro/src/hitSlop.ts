import type { HitSlop } from "js.foresight"

/**
 * Parses CSS-margin-style shorthand: "20", "10 40", "10 40 20" or "10 40 20 5"
 * (top right bottom left). Returns undefined on any non-numeric part.
 */
export const parseHitSlop = (value: string | undefined): HitSlop | undefined => {
  if (!value) {
    return undefined
  }

  const parts = value.trim().split(/\s+/).map(Number)

  if (parts.some(Number.isNaN)) {
    return undefined
  }

  const [top, right = top, bottom = top, left = right] = parts

  if (parts.length === 1) {
    return top
  }

  return { top, right, bottom, left }
}

/** Inverse of {@link parseHitSlop}, renders the `data-foresight-hit-slop` attribute. */
export const serializeHitSlop = (value: HitSlop | undefined): string | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === "number") {
    return String(value)
  }

  return `${value.top} ${value.right} ${value.bottom} ${value.left}`
}
