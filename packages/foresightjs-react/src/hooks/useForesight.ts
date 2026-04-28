import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  ForesightManager,
  createUnregisteredSnapshot,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

const NOOP_SUBSCRIBE = () => () => {}
const INITIAL_SNAPSHOT = createUnregisteredSnapshot(false)
const GET_INITIAL_SNAPSHOT = () => INITIAL_SNAPSHOT

export type UseForesightResult<T extends HTMLElement> = ForesightElementState & {
  elementRef: (node: T | null) => void
}

export const useForesight = <T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement
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
  useEffect(() => {
    if (!registerResults || !element) {
      return
    }

    ForesightManager.instance.register({
      ...optionsRef.current,
      element,
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
