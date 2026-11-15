import { untrack } from "svelte"
import { createUnregisteredSnapshot, ForesightManager } from "js.foresight"
import type { ForesightElementState } from "js.foresight"
import type { ForesightOptions, ForesightResult } from "./types.js"

/**
 * Create one reactive registration. Call during component initialization and bind
 * the returned action to one element. Pass a getter for reactive options.
 */
export const createForesight = (getOptions: () => ForesightOptions): ForesightResult => {
  let state = $state.raw<ForesightElementState>(createUnregisteredSnapshot(false))
  let bound = false

  return {
    get state() {
      return state
    },
    action(node) {
      if (bound) {
        throw new Error("Each createForesight result can bind only one element at a time.")
      }

      // No manager or DOM access occurs during component initialization/SSR.
      const manager = ForesightManager.instance
      const registration = manager.register({ ...untrack(getOptions), element: node })
      bound = true
      state = registration.getSnapshot()
      const unsubscribe = registration.subscribe(() => {
        state = registration.getSnapshot()
      })

      // This effect belongs to the action's scope and is disposed with it.
      $effect(() => {
        const options = getOptions()
        if (manager.registeredElements.has(node)) {
          manager.replaceElementOptions(node, options)
        }
      })

      return {
        destroy() {
          unsubscribe()
          registration.unregister()
          bound = false
          state = createUnregisteredSnapshot(false)
        },
      }
    },
  }
}
