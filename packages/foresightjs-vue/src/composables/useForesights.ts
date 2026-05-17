import {
  computed,
  markRaw,
  reactive,
  readonly,
  toValue,
  watch,
  onScopeDispose,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type VNodeRef,
} from "vue"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

export type UseForesightsSlot = {
  /** Callback ref — bind to `:ref="slot.setRef"` in `v-for` lists. */
  setRef: VNodeRef
  /** Reactive state for this slot. */
  state: Readonly<ForesightElementState>
}

type SlotInternal = {
  element: Element | null
  result: ForesightRegisterResult | null
  unsubscribe: (() => void) | null
  state: ForesightElementState
}

/**
 * Registers multiple elements with ForesightManager from a single composable.
 *
 * Returns a reactive array of `UseForesightsSlot` objects. Each slot exposes:
 * - `setRef`: a callback ref to bind via `:ref="slot.setRef"` in `v-for`.
 * - `state`: the reactive foresight state for that element.
 *
 * The composable handles dynamic array growth/shrinkage, option patching
 * without tearing down registrations, and proper cleanup on scope disposal.
 */
export const useForesights = (
  optionsArray: MaybeRefOrGetter<ForesightRegisterOptionsWithoutElement[]>
) => {
  const resolvedOptions = computed(() => toValue(optionsArray))

  const internals: SlotInternal[] = reactive([])
  const slots: UseForesightsSlot[] = reactive([])

  const registerSlot = (index: number, element: Element) => {
    const internal = internals[index]
    if (!internal) return

    const opts = resolvedOptions.value[index]
    if (!opts) return

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

  const createSetRef = (index: number): VNodeRef => {
    return (ref: Element | ComponentPublicInstance | null) => {
      const internal = internals[index]
      if (!internal) return

      // Extract underlying element from component instances
      const el: Element | null =
        ref === null ? null : ref instanceof Element ? ref : (ref.$el as Element)

      const prev = internal.element
      if (prev === el) return

      // Unregister old element if it was registered
      if (internal.result) {
        unregisterSlot(internal)
      }

      internal.element = el

      // Register new element
      if (el) {
        registerSlot(index, el)
      }
    }
  }

  // Reconcile slots when the options array length changes
  const reconcile = (newLength: number) => {
    const oldLength = internals.length

    // Shrink: unregister and remove excess slots
    while (internals.length > newLength) {
      const removed = internals.pop()!
      slots.pop()
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
      slots.push(
        reactive({
          setRef: createSetRef(i),
          state: readonly(state),
        })
      )
    }
  }

  // Watch the array length to reconcile slots
  watch(
    () => resolvedOptions.value.length,
    newLength => reconcile(newLength),
    { immediate: true }
  )

  // Patch options on existing registrations without unregistering
  watch(
    resolvedOptions,
    newOptions => {
      for (let i = 0; i < newOptions.length; i++) {
        const internal = internals[i]
        if (!internal?.element || !internal.result) continue

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
    slots.length = 0
  })

  return slots
}
