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
  mounted(element, binding) {
    const options =
      typeof binding.value === "function" ? { callback: binding.value } : binding.value

    const result = ForesightManager.instance.register({ element, ...options })
    resultMap.set(element, result)
  },

  updated(element, binding) {
    if (binding.value === binding.oldValue) {
      return
    }

    const options =
      typeof binding.value === "function" ? { callback: binding.value } : binding.value
    ForesightManager.instance.updateElementOptions(element, options)
  },

  unmounted(element) {
    resultMap.get(element)?.unregister()
    resultMap.delete(element)
  },
}
