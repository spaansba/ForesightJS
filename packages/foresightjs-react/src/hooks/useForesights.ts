import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"
import type { UseForesightResult } from "./useForesight"

const INITIAL_SNAPSHOT = createUnregisteredSnapshot(false)
const NOOP_SUBSCRIBE = () => () => {}
const EMPTY_SNAPSHOTS: ForesightElementState[] = []

type SlotEntry = {
  element: Element
  result: ForesightRegisterResult
}

export const useForesights = <T extends HTMLElement = HTMLElement>(
  optionsArray: ForesightRegisterOptionsWithoutElement[]
): UseForesightResult<T>[] => {
  const optionsRef = useRef(optionsArray)
  optionsRef.current = optionsArray

  const elementsRef = useRef(new Map<number, T>())
  const elementRefCallbacksRef = useRef(new Map<number, (node: T | null) => void>())
  const cachedSnapshotsRef = useRef<ForesightElementState[]>(EMPTY_SNAPSHOTS)
  const slotsRef = useRef(new Map<number, SlotEntry>())

  const [elements, setElements] = useState<ReadonlyMap<number, T>>(new Map())
  const [resultsList, setResultsList] = useState<ReadonlyMap<number, ForesightRegisterResult>>(
    new Map()
  )

  // Stable elementRef factory - one callback per index, reused across renders
  const getElementRef = useCallback((index: number): ((node: T | null) => void) => {
    let existing = elementRefCallbacksRef.current.get(index)
    if (!existing) {
      existing = (node: T | null) => {
        const prev = elementsRef.current.get(index) ?? null
        if (prev === node) {
          return
        }

        if (node) {
          elementsRef.current.set(index, node)
        } else {
          elementsRef.current.delete(index)
        }

        setElements(new Map(elementsRef.current))
      }
      elementRefCallbacksRef.current.set(index, existing)
    }

    return existing
  }, [])

  // Register/unregister when elements change or the array length changes
  useEffect(() => {
    const prevResults = new Map(slotsRef.current)
    const nextSlots = new Map<number, SlotEntry>()

    // Register each slot that has an element
    for (let i = 0; i < optionsArray.length; i++) {
      const el = elements.get(i)
      if (!el) {
        continue
      }

      const prev = prevResults.get(i)

      // If same element is already registered, keep the existing result
      if (prev && prev.element === el) {
        nextSlots.set(i, prev)
        prevResults.delete(i)
        continue
      }

      // New or swapped element - register it
      const result = ForesightManager.instance.register({
        ...optionsRef.current[i],
        element: el,
        callback: (state: ForesightElementState) => optionsRef.current[i].callback(state),
      })
      nextSlots.set(i, { element: el, result })
    }

    // Unregister everything that's no longer needed
    for (const [, slot] of prevResults) {
      slot.result.unregister()
    }

    slotsRef.current = nextSlots
    setResultsList(new Map(Array.from(nextSlots.entries()).map(([k, v]) => [k, v.result])))

    return () => {
      for (const [, slot] of slotsRef.current) {
        slot.result.unregister()
      }
      slotsRef.current = new Map()
    }
  }, [optionsArray.length, elements])

  // Patch options on existing registrations without tearing them down
  useEffect(() => {
    for (let i = 0; i < optionsArray.length; i++) {
      const slot = slotsRef.current.get(i)
      if (!slot) {
        continue
      }

      ForesightManager.instance.register({
        ...optionsRef.current[i],
        element: slot.element,
        callback: (state: ForesightElementState) => optionsRef.current[i].callback(state),
      })
    }
  }, [
    optionsArray.length,
    ...optionsArray.map(o => o.reactivateAfter),
    ...optionsArray.map(o => o.name),
    ...optionsArray.map(o => o.meta),
  ])

  // Subscribe to all active registrations. Re-subscribes when the set of results changes.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (resultsList.size === 0) {
        return NOOP_SUBSCRIBE()
      }

      const unsubs: (() => void)[] = []
      for (const [, result] of resultsList) {
        unsubs.push(result.subscribe(onStoreChange))
      }

      return () => unsubs.forEach(u => u())
    },
    [resultsList]
  )

  // getSnapshot must return a referentially stable value when nothing changed.
  const getSnapshot = useCallback((): ForesightElementState[] => {
    const length = optionsRef.current.length
    const cached = cachedSnapshotsRef.current

    let changed = cached.length !== length
    if (!changed) {
      for (let i = 0; i < length; i++) {
        const result = resultsList.get(i)
        const current = result?.getSnapshot() ?? INITIAL_SNAPSHOT
        if (current !== cached[i]) {
          changed = true
          break
        }
      }
    }

    if (!changed) {
      return cached
    }

    const next: ForesightElementState[] = []
    for (let i = 0; i < length; i++) {
      const result = resultsList.get(i)
      next.push(result?.getSnapshot() ?? INITIAL_SNAPSHOT)
    }
    cachedSnapshotsRef.current = next

    return next
  }, [resultsList])

  const getServerSnapshot = useCallback(
    (): ForesightElementState[] => optionsRef.current.map(() => INITIAL_SNAPSHOT),
    []
  )

  const states = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return optionsArray.map((_, i) => ({
    elementRef: getElementRef(i),
    ...(states[i] ?? INITIAL_SNAPSHOT),
  }))
}
