import type { Action } from "svelte/action"
import { ForesightManager } from "js.foresight"
import type { ForesightOptions } from "./types.js"

/** Register an element with `use:foresight={options}`. Runs only in the browser. */
export const foresight: Action<HTMLElement, ForesightOptions> = (node, options) => {
  const manager = ForesightManager.instance
  const registration = manager.register({ ...options, element: node })

  return {
    update(nextOptions) {
      // Registration can be refused by the manager's device/connection policy.
      if (manager.registeredElements.has(node)) {
        manager.replaceElementOptions(node, nextOptions)
      }
    },
    destroy() {
      registration.unregister()
    },
  }
}
