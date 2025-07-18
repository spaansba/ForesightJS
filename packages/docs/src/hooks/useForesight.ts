import { useRef, useEffect } from "react"
import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

export default function useForesight<T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement
) {
  const elementRef = useRef<T>(null)
  const registerResults = useRef<ForesightRegisterResult | null>(null)
  useEffect(() => {
    if (!elementRef.current) return

    registerResults.current = ForesightManager.instance.register({
      element: elementRef.current,
      callback: options.callback,
      hitSlop: options.hitSlop,
      name: options.name,
      reactivateAfter: options.reactivateAfter,
    })

    return () => {
      registerResults.current?.unregister()
    }
  }, [options])

  return { elementRef, registerResults }
}
