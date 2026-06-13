import { useEffect } from "react"
import type { ForesightElementState, ForesightRegisterResult } from "js.foresight"

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

const apply = (element: HTMLElement, state: ForesightElementState) => {
  for (const [attribute, read] of Object.entries(DATA_ATTRIBUTES)) {
    const value = read(state)
    if (typeof value === "string") {
      element.setAttribute(attribute, value)
    } else {
      element.toggleAttribute(attribute, value === true)
    }
  }
}

// Mirrors the element state onto data-* attributes by mutating the DOM
// directly, so CSS like [data-predicted] can style predictions without
// subscribing the component to state-driven re-renders.
export const useForesightDataAttributes = (
  element: HTMLElement | null,
  registerResults: ForesightRegisterResult | null
): void => {
  useEffect(() => {
    if (!element || !registerResults) {
      return
    }

    apply(element, registerResults.getSnapshot())
    const unsubscribe = registerResults.subscribe(() => {
      apply(element, registerResults.getSnapshot())
    })

    return () => {
      unsubscribe()
      for (const attribute of Object.keys(DATA_ATTRIBUTES)) {
        element.removeAttribute(attribute)
      }
    }
  }, [element, registerResults])
}
