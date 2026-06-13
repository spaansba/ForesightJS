import type { ForesightElementState } from "js.foresight"

// Single source of truth for the mirrored attributes: a boolean toggles the
// bare attribute, a string becomes its value, undefined removes it.
const DATA_ATTRIBUTES: Record<
  string,
  (state: ForesightElementState) => boolean | string | undefined
> = {
  "data-predicted": state => state.isPredicted,
  "data-callback-running": state => state.isCallbackRunning,
  "data-status": state => state.status,
}

const DATA_ATTRIBUTE_ENTRIES = Object.entries(DATA_ATTRIBUTES)
const DATA_ATTRIBUTE_NAMES = Object.keys(DATA_ATTRIBUTES)

export const applyDataAttributes = (element: Element, state: ForesightElementState) => {
  for (const [attribute, read] of DATA_ATTRIBUTE_ENTRIES) {
    const value = read(state)
    if (typeof value === "string") {
      element.setAttribute(attribute, value)
    } else {
      element.toggleAttribute(attribute, value === true)
    }
  }
}

export const removeDataAttributes = (element: Element) => {
  for (const attribute of DATA_ATTRIBUTE_NAMES) {
    element.removeAttribute(attribute)
  }
}
