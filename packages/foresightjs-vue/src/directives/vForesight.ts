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

// Register on mount, patch options (incl. enabled) on update. The WeakMap is the
// source of truth for whether the element is currently registered.
const sync = (element: ForesightDirectiveElement, value: ForesightDirectiveValue) => {
  const options = resolveOptions(value)

  if (resultMap.has(element)) {
    ForesightManager.instance.updateElementOptions(element, options)
  } else {
    register(element, options)
  }
}

export const vForesight: ObjectDirective<ForesightDirectiveElement, ForesightDirectiveValue> = {
  mounted(element, binding) {
    sync(element, binding.value)
  },

  updated(element, binding) {
    if (binding.value === binding.oldValue) {
      return
    }

    sync(element, binding.value)
  },

  unmounted(element) {
    unregister(element)
  },
}
