import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterResult,
} from "js.foresight"
import type { UseForesightOptions, UseForesightResult } from "../types"

const NOOP_SUBSCRIBE = () => () => {}
const INITIAL_SNAPSHOT = createUnregisteredSnapshot(false)
const GET_INITIAL_SNAPSHOT = () => INITIAL_SNAPSHOT

export const useForesight = <T extends HTMLElement = HTMLElement>(
  options: UseForesightOptions
): UseForesightResult<T> => {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const enabled = options.enabled !== false

  const [element, setElement] = useState<T | null>(null)
  const [registerResults, setRegisterResults] = useState<ForesightRegisterResult | null>(null)

  const elementRef = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  // Register/unregister when the DOM node attaches or swaps, or when enabled changes.
  useEffect(() => {
    if (!element || !enabled) {
      return
    }

    const result = ForesightManager.instance.register({
      ...optionsRef.current,
      element,
      callback: (state: ForesightElementState) => optionsRef.current.callback(state),
    })
    setRegisterResults(result)

    return () => {
      result.unregister()
      setRegisterResults(null)
    }
  }, [element, enabled])

  // Patch options on the existing registration without tearing it down.
  useEffect(() => {
    if (!registerResults || !element) {
      return
    }

    ForesightManager.instance.updateElementOptions(element, {
      ...optionsRef.current,
      callback: (state: ForesightElementState) => optionsRef.current.callback(state),
    })
  }, [options.reactivateAfter, options.name, options.meta, element, registerResults])

  const state = useSyncExternalStore<ForesightElementState>(
    registerResults?.subscribe ?? NOOP_SUBSCRIBE,
    registerResults?.getSnapshot ?? GET_INITIAL_SNAPSHOT,
    GET_INITIAL_SNAPSHOT
  )

  return { elementRef, ...state }
}
