import type { ObjectDirective } from "vue"
import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

export type ForesightDirectiveValue = ForesightRegisterOptionsWithoutElement | (() => void)

const resultMap = new WeakMap<HTMLElement, ForesightRegisterResult>()

export const vForesight: ObjectDirective<HTMLElement, ForesightDirectiveValue> = {
  mounted(el, binding) {
    const options =
      typeof binding.value === "function" ? { callback: binding.value } : binding.value
    const result = ForesightManager.instance.register({ element: el, ...options })
    resultMap.set(el, result)
  },

  updated(el, binding) {
    const options =
      typeof binding.value === "function" ? { callback: binding.value } : binding.value
    ForesightManager.instance.register({ element: el, ...options })
  },

  unmounted(el) {
    resultMap.get(el)?.unregister()
    resultMap.delete(el)
  },
}
