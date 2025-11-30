import { ref, onMounted, useTemplateRef, readonly, type ComponentPublicInstance } from "vue"
import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

type UseForesightOptions = ForesightRegisterOptionsWithoutElement & {
  templateRefKey: string
}

export function useForesight<T extends HTMLElement | ComponentPublicInstance>(
  options: UseForesightOptions
) {
  const templateRef = useTemplateRef<T>(options.templateRefKey)

  const registerResults = ref<ForesightRegisterResult | null>(null)

  onMounted(() => {
    if (!templateRef.value) {
      return
    }

    // Extract the underlying HTMLElement if the templateRef is a Vue component
    const element =
      templateRef.value instanceof HTMLElement ? templateRef.value : templateRef.value.$el

    registerResults.value = ForesightManager.instance.register({
      element,
      ...options,
    })
  })

  return {
    templateRef,
    registerResults: readonly(registerResults),
  }
}
