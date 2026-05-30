import {
  reactive,
  readonly,
  toRaw,
  toRefs,
  toValue,
  onScopeDispose,
  watch,
  type MaybeRefOrGetter,
} from "vue"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterResult,
} from "js.foresight"
import type { MaybeElement, UseForesightOptions, UseForesightReturn } from "../types"
import { resolveElement } from "../utils/resolveElement"

/**
 * Registers a single element with ForesightManager.
 *
 * @param options - Registration options as a plain object, ref, or getter.
 *
 * Returns reactive refs for all element state (`isPredicted`, `hitCount`, etc.)
 * plus a `setRef` function to bind the target element.
 *
 * @example
 * ```ts
 * const { isPredicted, setRef } = useForesight({
 *   callback: () => prefetch('/about'),
 *   name: 'about-link',
 * })
 * ```
 * ```vue
 * <a :ref="setRef" href="/about">About</a>
 * ```
 */
export const useForesight = (
  options: MaybeRefOrGetter<UseForesightOptions>
): UseForesightReturn => {
  const state = reactive(createUnregisteredSnapshot(false))

  let currentElement: Element | null = null
  let registerResults: ForesightRegisterResult | null = null
  let unsubscribe: (() => void) | null = null

  const callback = (s: ForesightElementState) => toValue(options).callback(s)

  const registerElement = (element: Element, registerOptions: UseForesightOptions) => {
    registerResults = ForesightManager.instance.register({
      ...registerOptions,
      element,
      callback,
    })

    Object.assign(state, registerResults.getSnapshot())
    unsubscribe = registerResults.subscribe(() => {
      if (registerResults) {
        Object.assign(state, registerResults.getSnapshot())
      }
    })
  }

  const unregisterElement = () => {
    unsubscribe?.()
    unsubscribe = null
    registerResults?.unregister()
    registerResults = null
    Object.assign(state, createUnregisteredSnapshot(false))
  }

  // Register on element attach, patch options (incl. enabled) on change.
  // `setRef` owns unregistering when the element detaches or swaps.
  const syncRegistration = () => {
    const element = currentElement
    if (!element) {
      return
    }

    const currentOptions = toValue(options)
    if (registerResults) {
      ForesightManager.instance.updateElementOptions(element, { ...currentOptions, callback })
    } else {
      registerElement(element, currentOptions)
    }
  }

  const setRef = (el: MaybeElement) => {
    const resolved = resolveElement(el) ?? null

    if (resolved === currentElement) {
      return
    }

    // Tear down the old registration before swapping the element.
    if (currentElement && registerResults) {
      unregisterElement()
    }

    currentElement = resolved
    syncRegistration()
  }

  // Re-sync whenever options change. Skip when the raw reference hasn't changed
  // (e.g. getter returning the same object).
  watch(
    () => toValue(options),
    (newOptions, oldOptions) => {
      if (oldOptions && toRaw(newOptions) === toRaw(oldOptions)) {
        return
      }

      syncRegistration()
    },
    { flush: "post" }
  )

  onScopeDispose(() => {
    unregisterElement()
  })

  return { ...toRefs(readonly(state)), setRef }
}
