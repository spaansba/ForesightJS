import {
  computed,
  reactive,
  readonly,
  toRefs,
  toValue,
  watch,
  onScopeDispose,
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

export type MaybeElement = HTMLElement | SVGElement | ComponentPublicInstance | null | undefined

export type MaybeElementRef = MaybeRefOrGetter<MaybeElement>

/**
 * Resolves a MaybeElement to a raw DOM Element or null.
 * Handles ComponentPublicInstance by extracting $el.
 */
const resolveElement = (target: MaybeElement): Element | null => {
  if (!target) return null
  if (target instanceof Element) return target
  return (target as ComponentPublicInstance).$el ?? null
}

/**
 * Registers a single element with ForesightManager.
 *
 * Accepts the element target as a ref, getter, or raw element (first argument)
 * and registration options as a plain object, ref, or getter (second argument).
 *
 * The composable watches the target and automatically registers when it becomes
 * available, unregisters when removed, and handles element swaps.
 */
export const useForesight = (
  target: MaybeElementRef,
  options: MaybeRefOrGetter<ForesightRegisterOptionsWithoutElement>
) => {
  const resolvedOptions = computed(() => toValue(options))
  const state = reactive(createUnregisteredSnapshot(false))

  let registerResults: ForesightRegisterResult | null = null
  let unsubscribe: (() => void) | null = null

  const updateState = (newState: ForesightElementState) => {
    Object.assign(state, newState)
  }

  const registerElement = (element: Element) => {
    const resolved = resolvedOptions.value

    registerResults = ForesightManager.instance.register({
      element,
      callback: (s: ForesightElementState) => resolvedOptions.value.callback(s),
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

  const unregisterElement = () => {
    unsubscribe?.()
    unsubscribe = null
    registerResults?.unregister()
    registerResults = null
    updateState(createUnregisteredSnapshot(false))
  }

  // Watch the target element. flush:'post' ensures the DOM is updated.
  watch(
    () => resolveElement(toValue(target)),
    (newEl, oldEl) => {
      if (oldEl && oldEl !== newEl) {
        unregisterElement()
      }
      if (newEl && newEl !== oldEl) {
        registerElement(newEl)
      }
    },
    { flush: "post" }
  )

  // Watch options for changes — patch without re-registering
  watch(
    resolvedOptions,
    () => {
      const el = resolveElement(toValue(target))
      if (!el || !registerResults) return

      const resolved = resolvedOptions.value
      ForesightManager.instance.updateElementOptions(el, {
        callback: (s: ForesightElementState) => resolvedOptions.value.callback(s),
        hitSlop: resolved.hitSlop,
        name: resolved.name,
        meta: resolved.meta,
        reactivateAfter: resolved.reactivateAfter,
      })
    },
    { flush: "post" }
  )

  onScopeDispose(() => {
    unregisterElement()
  })

  return { ...toRefs(readonly(state)) }
}
