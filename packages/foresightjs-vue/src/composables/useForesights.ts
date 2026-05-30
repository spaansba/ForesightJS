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
  type ForesightRegisterResult,
} from "js.foresight"
import { resolveElement } from "../utils/resolveElement"
import type { MaybeElement, UseForesightOptions } from "../types"

export type UseForesightSlot = Readonly<ForesightElementState> & {
  /** Template ref function - bind to an element with `:ref="slot.setRef"`. */
  setRef: (el: MaybeElement) => void
}

type Slot = {
  element: Element | null
  result: ForesightRegisterResult | null
  unsubscribe: (() => void) | null
  state: ForesightElementState & { setRef: (el: MaybeElement) => void }
}

/**
 * Registers multiple elements with ForesightManager from a single composable.
 *
 * @param options - Array of registration options (plain array, ref, or getter).
 *   The array length determines the number of slots.
 *
 * Returns a reactive array of `UseForesightSlot` objects. Each slot contains:
 * - `setRef` - a template ref function to bind an element (`:ref="slot.setRef"`)
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
  options: MaybeRefOrGetter<UseForesightOptions[]>
): UseForesightSlot[] => {
  const resolvedOptions = computed(() => toValue(options))
  const managed: Slot[] = []
  const slots: UseForesightSlot[] = reactive([])

  const register = (slot: Slot, index: number) => {
    const slotOptions = resolvedOptions.value[index]
    if (!slotOptions) {
      return
    }

    const result = markRaw(
      ForesightManager.instance.register({
        ...slotOptions,
        element: slot.element!,
        callback: (state: ForesightElementState) => resolvedOptions.value[index]?.callback(state),
      })
    )

    slot.result = result
    Object.assign(slot.state, result.getSnapshot())

    slot.unsubscribe = result.subscribe(() => {
      if (slot.result) {
        Object.assign(slot.state, slot.result.getSnapshot())
      }
    })
  }

  const unregister = (slot: Slot) => {
    slot.unsubscribe?.()
    slot.unsubscribe = null
    slot.result?.unregister()
    slot.result = null
    Object.assign(slot.state, createUnregisteredSnapshot(false))
  }

  const createSlot = (index: number): Slot => {
    const state = reactive({
      ...createUnregisteredSnapshot(false),
      // `setRef` owns unregistering when the element detaches or swaps.
      setRef: (el: MaybeElement) => {
        const resolved = resolveElement(el) ?? null
        const slot = managed[index]
        if (!slot || slot.element === resolved) {
          return
        }

        if (slot.result) {
          unregister(slot)
        }

        slot.element = resolved
        if (resolved) {
          register(slot, index)
        }
      },
    }) as Slot["state"]

    return { element: null, result: null, unsubscribe: null, state }
  }

  // Single watch handles both length changes and option updates
  watch(
    resolvedOptions,
    (newOptions, oldOptions) => {
      // Shrink
      while (managed.length > newOptions.length) {
        const removed = managed.pop()!
        slots.pop()
        if (removed.result) {
          unregister(removed)
        }
      }

      // Patch existing slots whose options changed
      for (let i = 0; i < Math.min(managed.length, newOptions.length); i++) {
        if (oldOptions && toRaw(newOptions[i]) === toRaw(oldOptions[i])) {
          continue
        }

        const slot = managed[i]
        if (slot.element && slot.result) {
          ForesightManager.instance.updateElementOptions(slot.element, {
            ...newOptions[i],
            callback: (state: ForesightElementState) => resolvedOptions.value[i]?.callback(state),
          })
        }
      }

      // Grow
      const previousLength = managed.length
      for (let i = previousLength; i < newOptions.length; i++) {
        const slot = createSlot(i)
        managed.push(slot)
        slots.push(readonly(slot.state) as UseForesightSlot)
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    for (const slot of managed) {
      if (slot.result) {
        unregister(slot)
      }
    }
    managed.length = 0
    slots.length = 0
  })

  return slots
}
