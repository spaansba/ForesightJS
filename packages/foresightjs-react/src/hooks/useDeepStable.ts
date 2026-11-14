import { useRef } from "react"

export const isDeepEqual = (
  a: unknown,
  b: unknown,
  visited = new WeakMap<object, object>()
): boolean => {
  if (Object.is(a, b) || (typeof a === "function" && typeof b === "function")) {
    return true
  }

  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (visited.has(a)) {
    return visited.get(a) === b
  }

  visited.set(a, b)

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  const entries = Object.entries(a)
  const other = new Map(Object.entries(b))

  return (
    entries.length === other.size &&
    entries.every(([key, value]) => other.has(key) && isDeepEqual(value, other.get(key), visited))
  )
}

export const useDeepStable = <T>(value: T): T => {
  const ref = useRef(value)

  if (!isDeepEqual(ref.current, value)) {
    ref.current = value
  }

  return ref.current
}
