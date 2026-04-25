import {
  ref,
  shallowRef,
  onMounted,
  onScopeDispose,
  useTemplateRef,
  readonly,
  type ComponentPublicInstance,
} from "vue"
import {
  ForesightManager,
  type ForesightElementState,
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
  const state = shallowRef<ForesightElementState | null>(null)
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    if (!templateRef.value) {
      return
    }

    const element: HTMLElement =
      templateRef.value instanceof HTMLElement ? templateRef.value : templateRef.value.$el

    const result = ForesightManager.instance.register({
      element,
      ...options,
    })
    registerResults.value = result
    state.value = result.getSnapshot()
    unsubscribe = result.subscribe(() => {
      state.value = result.getSnapshot()
    })
  })

  onScopeDispose(() => {
    unsubscribe?.()
  })

  return {
    templateRef,
    registerResults: readonly(registerResults),
    state: readonly(state),
  }
}
