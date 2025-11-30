import type { Directive } from "vue"
import { ForesightManager, type ForesightRegisterOptionsWithoutElement } from "js.foresight"

type ForesightDirectiveValue = ForesightRegisterOptionsWithoutElement | (() => void)

export const vForesight: Directive<HTMLElement, ForesightDirectiveValue> = {
  mounted(element, binding) {
    const value = binding.value

    const options: ForesightRegisterOptionsWithoutElement =
      typeof value === "function" ? { callback: value } : value

    ForesightManager.instance.register({
      element,
      ...options,
    })
  },
}
