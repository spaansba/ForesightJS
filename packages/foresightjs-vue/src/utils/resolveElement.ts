import type { MaybeElement } from "../types"

/**
 * Resolves a template ref to a DOM Element, or null when there is none.
 * Components resolve to their `$el`, which is not an Element when the
 * component renders nothing (comment) or multiple roots (text anchor).
 */
export const resolveElement = (target: MaybeElement): Element | null => {
  const el = target instanceof Element ? target : target?.$el

  return el instanceof Element ? el : null
}
