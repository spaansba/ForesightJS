import type { ObjectDirective } from "vue"
import { ForesightManager, type ForesightRegisterResult } from "js.foresight"
import type { UseForesightOptions } from "../types"

/** Shorthand: pass just the callback instead of a full options object. */
type CallbackShorthand = () => void

type ForesightDirectiveValue = UseForesightOptions | CallbackShorthand

type ForesightDirectiveElement = HTMLElement | SVGElement

const resultMap = new WeakMap<ForesightDirectiveElement, ForesightRegisterResult>()

const isCallbackShorthand = (value: ForesightDirectiveValue): value is CallbackShorthand =>
  typeof value === "function"

const resolveOptions = (value: ForesightDirectiveValue): UseForesightOptions =>
  isCallbackShorthand(value) ? { callback: value } : value

const register = (element: ForesightDirectiveElement, options: UseForesightOptions) => {
  resultMap.set(element, ForesightManager.instance.register({ element, ...options }))
}

const unregister = (element: ForesightDirectiveElement) => {
  resultMap.get(element)?.unregister()
  resultMap.delete(element)
}

export const vForesight: ObjectDirective<ForesightDirectiveElement, ForesightDirectiveValue> = {
  mounted(element, binding) {
    register(element, resolveOptions(binding.value))
  },

  // Patch options (incl. enabled) on change without tearing down.
  updated(element, binding) {
    if (binding.value === binding.oldValue) {
      return
    }

    ForesightManager.instance.updateElementOptions(element, resolveOptions(binding.value))
  },

  unmounted(element) {
    unregister(element)
  },
}
