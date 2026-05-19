import {
  computed,
  reactive,
  readonly,
  toRaw,
  toRefs,
  toValue,
  onScopeDispose,
  watch,
  type MaybeRefOrGetter,
  type ToRefs,
} from "vue"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"
import type { MaybeElement } from "../types"
import { resolveElement } from "../utils/resolveElement"

export type UseForesightReturn = ToRefs<Readonly<ForesightElementState>> & {
  /** Template ref function — bind to an element with `:ref="setRef"`. */
  setRef: (el: MaybeElement) => void
}

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
  options: MaybeRefOrGetter<ForesightRegisterOptionsWithoutElement>
): UseForesightReturn => {
  const resolvedOptions = computed(() => toValue(options))
  const state = reactive(createUnregisteredSnapshot(false))

  let currentElement: Element | null = null
  let registerResults: ForesightRegisterResult | null = null
  let unsubscribe: (() => void) | null = null

  const updateState = (newState: ForesightElementState) => {
    Object.assign(state, newState)
  }

  const registerElement = (element: Element) => {
    const opts = resolvedOptions.value
    registerResults = ForesightManager.instance.register({
      ...opts,
      element,
      callback: (s: ForesightElementState) => resolvedOptions.value.callback(s),
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

  const setRef = (el: MaybeElement) => {
    const resolved = resolveElement(el) ?? null

    if (resolved === currentElement) {
      return
    }

    if (currentElement && registerResults) {
      unregisterElement()
    }

    currentElement = resolved

    if (resolved) {
      registerElement(resolved)
    }
  }

  // Watch options for changes — patch without re-registering.
  // Skip when the raw reference hasn't changed (e.g. getter returning same object).
  watch(
    resolvedOptions,
    (newOpts, oldOpts) => {
      if (oldOpts && toRaw(newOpts) === toRaw(oldOpts)) {
        return
      }

      if (!currentElement || !registerResults) {
        return
      }

      ForesightManager.instance.updateElementOptions(currentElement, {
        ...newOpts,
        callback: (s: ForesightElementState) => resolvedOptions.value.callback(s),
      })
    },
    { flush: "post" }
  )

  onScopeDispose(() => {
    unregisterElement()
  })

  return { ...toRefs(readonly(state)), setRef }
}
