import type { ComponentPublicInstance } from "vue"
import type { MaybeElement, ResolvedElement } from "../types"

/**
 * Resolves a MaybeElement to a raw DOM Element or null.
 * Handles ComponentPublicInstance by extracting $el.
 * Filters out comment nodes (components that render nothing).
 */
export const resolveElement = <T extends MaybeElement>(target: T): ResolvedElement<T> | null => {
  if (!target) {
    return null
  }

  if (target instanceof Element) {
    return target as ResolvedElement<T>
  }

  const el = (target as ComponentPublicInstance).$el
  // Filter comment nodes — a component with v-if="false" or empty template
  // leaves a #comment placeholder that has no size or position.
  if (el instanceof Node && el.nodeType === Node.COMMENT_NODE) {
    return null
  }

  return (el ?? null) as ResolvedElement<T> | null
}
