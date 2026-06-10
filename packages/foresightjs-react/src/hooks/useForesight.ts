import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterResult,
} from "js.foresight"
import type { UseForesightOptions, UseForesightResult } from "../types"
import { serializeOption } from "./serializeOption"

const NOOP_SUBSCRIBE = () => () => {}
const INITIAL_SNAPSHOT = createUnregisteredSnapshot(false)
const GET_INITIAL_SNAPSHOT = () => INITIAL_SNAPSHOT

export const useForesight = <T extends HTMLElement = HTMLElement>(
  options: UseForesightOptions
): UseForesightResult<T> => {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [element, setElement] = useState<T | null>(null)
  const [registerResults, setRegisterResults] = useState<ForesightRegisterResult | null>(null)

  const elementRef = useCallback((node: T | null) => {
    setElement(node)
  }, [])

  // Register/unregister when the DOM node attaches or swaps.
  useEffect(() => {
    if (!element) {
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
  }, [element])

  // Patch options on the existing registration without tearing it down.
  // meta and hitSlop are compared by content, not identity - an inline
  // `meta={{...}}` object would otherwise re-fire this effect every render and
  // loop with the useSyncExternalStore re-render it triggers.
  const metaKey = serializeOption(options.meta)
  const hitSlopKey = serializeOption(options.hitSlop)
  useEffect(() => {
    if (!registerResults || !element) {
      return
    }

    ForesightManager.instance.updateElementOptions(element, {
      ...optionsRef.current,
      callback: (state: ForesightElementState) => optionsRef.current.callback(state),
    })
  }, [
    options.reactivateAfter,
    options.name,
    metaKey,
    options.enabled,
    hitSlopKey,
    element,
    registerResults,
  ])

  const state = useSyncExternalStore<ForesightElementState>(
    registerResults?.subscribe ?? NOOP_SUBSCRIBE,
    () => registerResults?.getSnapshot() ?? INITIAL_SNAPSHOT,
    GET_INITIAL_SNAPSHOT
  )

  return { elementRef, ...state }
}
