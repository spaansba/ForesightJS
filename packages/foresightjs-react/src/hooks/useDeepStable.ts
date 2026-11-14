import { useRef } from "react"

const isPlainObject = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

export const isDeepEqual = (
  a: unknown,
  b: unknown,
  visited = new WeakMap<object, object>()
): boolean => {
  if (Object.is(a, b)) {
    return true
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index], visited))
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null ||
    !isPlainObject(a) ||
    !isPlainObject(b)
  ) {
    return false
  }

  if (visited.get(a) === b) {
    return true
  }

  visited.set(a, b)

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
