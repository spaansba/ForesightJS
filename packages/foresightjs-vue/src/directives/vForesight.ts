import type { ObjectDirective } from "vue"
import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

type ForesightDirectiveValue = ForesightRegisterOptionsWithoutElement | (() => void)

type ForesightDirectiveElement = HTMLElement | SVGElement

const resultMap = new WeakMap<ForesightDirectiveElement, ForesightRegisterResult>()

export const vForesight: ObjectDirective<ForesightDirectiveElement, ForesightDirectiveValue> = {
  mounted(el, binding) {
    const options =
      typeof binding.value === "function" ? { callback: binding.value } : binding.value

    const result = ForesightManager.instance.register({ element: el, ...options })
    resultMap.set(el, result)
  },

  updated(el, binding) {
    if (binding.value === binding.oldValue) {
      return
    }

    const options =
      typeof binding.value === "function" ? { callback: binding.value } : binding.value
    ForesightManager.instance.updateElementOptions(el, options)
  },

  unmounted(el) {
    resultMap.get(el)?.unregister()
    resultMap.delete(el)
  },
}
