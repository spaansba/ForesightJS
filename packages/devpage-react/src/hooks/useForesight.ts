import { useRef, useEffect, useState, useSyncExternalStore } from "react"
import {
  ForesightManager,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

const NOOP_SUBSCRIBE = () => () => {}
const GET_NULL_STATE = (): ForesightElementState | null => null

export default function useForesight<T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement
) {
  const elementRef = useRef<T>(null)
  const [registerResults, setRegisterResults] = useState<ForesightRegisterResult | null>(null)

  useEffect(() => {
    if (!elementRef.current) return

    setRegisterResults(
      ForesightManager.instance.register({
        element: elementRef.current,
        ...options,
      })
    )
  }, [options])

  const state = useSyncExternalStore<ForesightElementState | null>(
    registerResults?.subscribe ?? NOOP_SUBSCRIBE,
    registerResults?.getSnapshot ?? GET_NULL_STATE,
    GET_NULL_STATE
  )

  return { elementRef, registerResults, state }
}
