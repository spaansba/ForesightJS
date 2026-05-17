import {
  computed,
  reactive,
  readonly,
  toRefs,
  toValue,
  useTemplateRef,
  watch,
  onScopeDispose,
  type MaybeRefOrGetter,
} from "vue"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"
import type { MaybeElementRef } from "../types"
import { resolveElement } from "../utils/resolveElement"

/**
 * Registers a single element with ForesightManager.
 *
 * @param target - Accepts the element target as a string, ref, getter, or raw element.
 * @param options - Registration options as a plain object, ref, or getter.
 *
 * The composable watches the target and automatically registers when it becomes
 * available, unregisters when removed, and handles element swaps.
 */
export const useForesight = (
  target: MaybeElementRef | string,
  options: MaybeRefOrGetter<ForesightRegisterOptionsWithoutElement>
) => {
  const resolvedTarget: MaybeElementRef =
    typeof target === "string" ? useTemplateRef(target) : target

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
    () => resolveElement(toValue(resolvedTarget)),
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
      const el = resolveElement(toValue(resolvedTarget))
      if (!el || !registerResults) {
        return
      }

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
