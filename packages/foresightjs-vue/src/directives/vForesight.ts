import type { ObjectDirective } from "vue"
import { ForesightManager, type ForesightRegisterResult } from "js.foresight"
import type { UseForesightOptions } from "../types"

/** Shorthand: pass just the callback instead of a full options object. */
type CallbackShorthand = () => void

type ForesightDirectiveValue = UseForesightOptions | CallbackShorthand

type ForesightDirectiveElement = HTMLElement | SVGElement

const resultMap = new WeakMap<ForesightDirectiveElement, ForesightRegisterResult>()

const isCallbackShorthand = (value: ForesightDirectiveValue) => typeof value === "function"

const resolveOptions = (value: ForesightDirectiveValue): UseForesightOptions =>
  isCallbackShorthand(value) ? { callback: value } : value

// Shorthand form has no `enabled`, so it's always enabled.
const isEnabled = (value: ForesightDirectiveValue): boolean =>
  isCallbackShorthand(value) || value.enabled !== false

const register = (element: ForesightDirectiveElement, options: UseForesightOptions) => {
  resultMap.set(element, ForesightManager.instance.register({ element, ...options }))
}

const unregister = (element: ForesightDirectiveElement) => {
  resultMap.get(element)?.unregister()
  resultMap.delete(element)
}

// Reconcile the element's registration with its current value. The WeakMap is
// the source of truth for whether the element is currently registered.
const sync = (element: ForesightDirectiveElement, value: ForesightDirectiveValue) => {
  const registered = resultMap.has(element)
  const shouldBeRegistered = isEnabled(value)

  if (registered && !shouldBeRegistered) {
    unregister(element) // enabled toggled off
  } else if (!registered && shouldBeRegistered) {
    register(element, resolveOptions(value)) // first mount or enabled toggled on
  } else if (registered) {
    // still enabled → patch options without tearing down
    ForesightManager.instance.updateElementOptions(element, resolveOptions(value))
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
