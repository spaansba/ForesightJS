import {
  computed,
  reactive,
  readonly,
  toRefs,
  toValue,
  watch,
  onMounted,
  onScopeDispose,
  useTemplateRef,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
} from "vue"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

export type UseForesightOptions = ForesightRegisterOptionsWithoutElement & {
  templateRefKey: string
}

export const useForesight = <T extends HTMLElement | ComponentPublicInstance>(
  options: MaybeRefOrGetter<UseForesightOptions>
) => {
  const resolvedOptions = computed(() => toValue(options))
  const templateRef = useTemplateRef<T>(resolvedOptions.value.templateRefKey)

  const state = reactive(createUnregisteredSnapshot(false))

  let registerResults: ForesightRegisterResult | null = null
  let unsubscribe: (() => void) | null = null

  const updateState = (newState: ForesightElementState) => {
    Object.assign(state, newState)
  }

  const getElement = (): Element | null => {
    if (!templateRef.value) {
      return null
    }

    // Extract the underlying HTMLElement if the templateRef is a Vue component
    return templateRef.value instanceof HTMLElement ? templateRef.value : templateRef.value.$el
  }

  const registerElement = (element: Element) => {
    const resolved = resolvedOptions.value

    registerResults = ForesightManager.instance.register({
      element,
      callback: (state: ForesightElementState) => resolvedOptions.value.callback(state),
      hitSlop: resolved.hitSlop,
      name: resolved.name,
      meta: resolved.meta,
      reactivateAfter: resolved.reactivateAfter,
    })

    updateState(registerResults.getSnapshot())
    unsubscribe = registerResults.subscribe(() => {
      if (registerResults) {
        updateState(registerResults.getSnapshot())
      }
    })
  }

  onMounted(() => {
    const element = getElement()
    if (!element) {
      return
    }

    registerElement(element)
  })

  watch(
    resolvedOptions,
    () => {
      const element = getElement()
      if (!element || !registerResults) {
        return
      }

      // Tear down old subscription before re-registering with new options
      unsubscribe?.()
      registerElement(element)
    },
    { flush: "post" }
  )

  onScopeDispose(() => {
    console.log("scope dispose")
    unsubscribe?.()
    unsubscribe = null
    registerResults?.unregister()
    registerResults = null
    updateState(createUnregisteredSnapshot(false))
  })

  return {
    ...toRefs(readonly(state)),
    templateRef,
  }
}
