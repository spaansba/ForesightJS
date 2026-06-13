import type { ForesightElementState } from "../types/types"

// Single source of truth for the mirrored attributes: a boolean toggles the
// bare attribute, a string becomes its value, undefined removes it.
const DATA_ATTRIBUTES: Record<
  string,
  (state: ForesightElementState) => boolean | string | undefined
> = {
  "data-predicted": state => state.isPredicted,
  "data-active": state => state.isActive,
  "data-callback-running": state => state.isCallbackRunning,
  "data-status": state => state.status,
}

const DATA_ATTRIBUTE_ENTRIES = Object.entries(DATA_ATTRIBUTES)
const DATA_ATTRIBUTE_NAMES = Object.keys(DATA_ATTRIBUTES)

/**
 * Mirror the element's prediction state onto `data-*` attributes via direct DOM
 * mutation, so plain CSS (e.g. `[data-predicted]`) can style predictions without
 * any subscriber re-render. Controlled globally via the `setDataAttributes`
 * manager setting.
 */
export const applyDataAttributes = (element: Element, state: ForesightElementState): void => {
  for (const [attribute, read] of DATA_ATTRIBUTE_ENTRIES) {
    const value = read(state)
    if (typeof value === "string") {
      element.setAttribute(attribute, value)
    } else {
      element.toggleAttribute(attribute, value === true)
    }
  }
}

/** Remove every mirrored attribute from the element (used on unregister). */
export const removeDataAttributes = (element: Element): void => {
  for (const attribute of DATA_ATTRIBUTE_NAMES) {
    element.removeAttribute(attribute)
  }
}
