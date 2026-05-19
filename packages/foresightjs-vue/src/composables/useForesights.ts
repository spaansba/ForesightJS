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
import { resolveElement } from "../utils/resolveElement"
import type { MaybeElement } from "../types"

export type UseForesightSlot = Readonly<ForesightElementState> & {
  /** Template ref function — bind to an element with `:ref="slot.setRef"`. */
  setRef: (el: MaybeElement) => void
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
 * @param options - Array of registration options (plain array, ref, or getter).
 *   The array length determines the number of slots.
 *
 * Returns a reactive array of `UseForesightSlot` objects. Each slot contains:
 * - `setRef` — a template ref function to bind an element (`:ref="slot.setRef"`)
 * - All `ForesightElementState` properties (`isPredicted`, `hitCount`, etc.)
 *
 * @example
 * ```ts
 * const items = ref([{ name: 'a' }, { name: 'b' }])
 *
 * const slots = useForesights(() =>
 *   items.value.map(item => ({
 *     callback: () => prefetch(item.name),
 *     name: item.name,
 *   }))
 * )
 * ```
 * ```vue
 * <button v-for="(item, i) in items" :ref="slots[i].setRef">
 *   {{ slots[i].isPredicted ? 'predicted!' : item.name }}
 * </button>
 * ```
 */
export const useForesights = (
  options: MaybeRefOrGetter<ForesightRegisterOptionsWithoutElement[]>
): UseForesightSlot[] => {
  const resolvedOptions = computed(() => toValue(options))

  const internals: SlotInternal[] = reactive([])
  const slots: UseForesightSlot[] = reactive([])

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

  // Create a stable setRef function for a given slot index.
  // Vue calls template ref functions with the element (or null on unmount).
  const createSetRef = (index: number) => (el: MaybeElement) => {
    setSlotElement(index, resolveElement(el) ?? null)
  }

  // Reconcile array length: grow or shrink internals/slots
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
      const state = reactive({
        ...createUnregisteredSnapshot(false),
        setRef: createSetRef(i),
      }) as ForesightElementState & { setRef: (el: MaybeElement) => void }

      const internal: SlotInternal = reactive({
        element: null,
        result: null,
        unsubscribe: null,
        state,
      })

      internals.push(internal)
      slots.push(readonly(state) as UseForesightSlot)
    }
  }

  // Watch options length to reconcile slots
  watch(
    () => resolvedOptions.value.length,
    newLength => reconcile(newLength),
    { immediate: true }
  )

  // Patch options on existing registrations without unregistering.
  // Only patches slots whose options reference has actually changed.
  watch(
    resolvedOptions,
    (newOptions, oldOptions) => {
      const len = Math.min(newOptions.length, internals.length)
      for (let i = 0; i < len; i++) {
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
    slots.length = 0
  })

  return slots
}
