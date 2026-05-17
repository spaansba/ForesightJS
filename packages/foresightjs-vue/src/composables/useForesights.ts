import {
  computed,
  markRaw,
  reactive,
  readonly,
  toRaw,
  toValue,
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
import type { MaybeElement } from "../types"
import { resolveElement } from "../utils/resolveElement"

type SlotInternal = {
  element: Element | null
  result: ForesightRegisterResult | null
  unsubscribe: (() => void) | null
  state: ForesightElementState
}

/**
 * Registers multiple elements with ForesightManager from a single composable.
 *
 * @param targets - Array of element targets (refs, getters, or raw elements).
 * @param options - Array of registration options, one per target.
 *
 * Returns a reactive array of readonly state objects. Each `states[i]` contains
 * `isPredicted`, `hitCount`, `isCallbackRunning`, `status`, and `isRegistered`.
 *
 * The composable watches both targets and options arrays, handles dynamic array
 * growth/shrinkage, patches options without tearing down registrations, and
 * cleans up on scope disposal.
 */
export const useForesights = (
  targets: MaybeRefOrGetter<MaybeElement[]>,
  options: MaybeRefOrGetter<ForesightRegisterOptionsWithoutElement[]>
) => {
  const resolvedTargets = computed(() => toValue(targets).map(t => resolveElement(t) ?? null))
  const resolvedOptions = computed(() => toValue(options))

  const internals: SlotInternal[] = reactive([])
  const states: Readonly<ForesightElementState>[] = reactive([])

  const registerSlot = (index: number, element: Element) => {
    const internal = internals[index]
    if (!internal) {
      return
    }

    const opts = resolvedOptions.value[index]
    if (!opts) {
      return
    }

    const result = markRaw(
      ForesightManager.instance.register({
        ...opts,
        element,
        callback: (state: ForesightElementState) => resolvedOptions.value[index]?.callback(state),
      })
    )

    internal.result = result
    Object.assign(internal.state, result.getSnapshot())

    internal.unsubscribe = result.subscribe(() => {
      if (internal.result) {
        Object.assign(internal.state, internal.result.getSnapshot())
      }
    })
  }

  const unregisterSlot = (internal: SlotInternal) => {
    internal.unsubscribe?.()
    internal.unsubscribe = null
    internal.result?.unregister()
    internal.result = null
    Object.assign(internal.state, createUnregisteredSnapshot(false))
  }

  const setSlotElement = (index: number, el: Element | null) => {
    const internal = internals[index]
    if (!internal) {
      return
    }

    const prev = internal.element
    if (prev === el) {
      return
    }

    if (internal.result) {
      unregisterSlot(internal)
    }

    internal.element = el

    if (el) {
      registerSlot(index, el)
    }
  }

  // Reconcile array length: grow or shrink internals/states
  const reconcile = (newLength: number) => {
    const oldLength = internals.length

    // Shrink: unregister and remove excess slots
    while (internals.length > newLength) {
      const removed = internals.pop()!
      states.pop()
      if (removed.result) {
        unregisterSlot(removed)
      }
    }

    // Grow: add new slots
    for (let i = oldLength; i < newLength; i++) {
      const state = reactive(createUnregisteredSnapshot(false)) as ForesightElementState
      const internal: SlotInternal = reactive({
        element: null,
        result: null,
        unsubscribe: null,
        state,
      })

      internals.push(internal)
      states.push(readonly(state))
    }
  }

  // Watch targets length to reconcile slots
  watch(
    () => resolvedTargets.value.length,
    newLength => reconcile(newLength),
    { immediate: true }
  )

  // Watch resolved targets for element changes
  watch(
    resolvedTargets,
    newEls => {
      for (let i = 0; i < newEls.length; i++) {
        setSlotElement(i, newEls[i])
      }
    },
    { flush: "post" }
  )

  // Patch options on existing registrations without unregistering.
  // Only patches slots whose options reference has actually changed.
  watch(
    resolvedOptions,
    (newOptions, oldOptions) => {
      for (let i = 0; i < newOptions.length; i++) {
        const internal = internals[i]
        if (!internal?.element || !internal.result) {
          continue
        }

        // Skip if the options object is the same reference
        if (oldOptions && toRaw(newOptions[i]) === toRaw(oldOptions[i])) {
          continue
        }

        ForesightManager.instance.updateElementOptions(internal.element, {
          ...newOptions[i],
          callback: (state: ForesightElementState) => resolvedOptions.value[i]?.callback(state),
        })
      }
    },
    { flush: "post" }
  )

  onScopeDispose(() => {
    for (const internal of internals) {
      if (internal.result) {
        unregisterSlot(internal)
      }
    }
    internals.length = 0
    states.length = 0
  })

  return states
}
