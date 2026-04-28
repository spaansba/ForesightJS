import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react"
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
  elementRef: RefObject<T | null>
}

export const useForesight = <T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement
): UseForesightResult<T> => {
  const elementRef = useRef<T>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const [registerResults, setRegisterResults] = useState<ForesightRegisterResult | null>(null)

  useEffect(() => {
    if (!elementRef.current) {
      return
    }

    const element = elementRef.current
    const result = ForesightManager.instance.register({
      ...optionsRef.current,
      element,
      callback: state => optionsRef.current.callback(state),
    })
    setRegisterResults(result)

    return () => result.unregister()
  }, [])

  useEffect(() => {
    if (!registerResults || !elementRef.current) {
      return
    }

    ForesightManager.instance.register({
      ...optionsRef.current,
      element: elementRef.current,
      callback: state => optionsRef.current.callback(state),
    })
  }, [options.reactivateAfter, options.name, options.meta, registerResults])

  const state = useSyncExternalStore<ForesightElementState>(
    registerResults?.subscribe ?? NOOP_SUBSCRIBE,
    registerResults?.getSnapshot ?? GET_INITIAL_SNAPSHOT,
    GET_INITIAL_SNAPSHOT
  )

  return { elementRef, ...state }
}
