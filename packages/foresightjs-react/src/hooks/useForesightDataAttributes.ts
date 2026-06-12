import { useEffect } from "react"
import type { ForesightElementState, ForesightRegisterResult } from "js.foresight"

const DATA_ATTRIBUTES = ["data-predicted", "data-callback-running", "data-status"] as const

const apply = (element: HTMLElement, state: ForesightElementState) => {
  element.toggleAttribute("data-predicted", state.isPredicted)
  element.toggleAttribute("data-callback-running", state.isCallbackRunning)
  if (state.status) {
    element.setAttribute("data-status", state.status)
  } else {
    element.removeAttribute("data-status")
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
      for (const attribute of DATA_ATTRIBUTES) {
        element.removeAttribute(attribute)
      }
    }
  }, [element, registerResults])
}
