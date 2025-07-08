import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"
import { useRef, useEffect, useState } from "react"

export default function useForesight<T extends HTMLElement = HTMLElement>(
  options: ForesightRegisterOptionsWithoutElement
) {
  const elementRef = useRef<T>(null)
  const [registerResults, setRegisterResults] = useState<ForesightRegisterResult | null>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const result = ForesightManager.instance.register({
      element: elementRef.current,
      ...options,
      callback: async () => {
        // Add artificial delay to test timing measurement
        const start = Date.now()
        await new Promise(resolve => setTimeout(resolve, 20)) // 100ms delay
        const end = Date.now()
        console.log(`Custom callback took ${end - start}ms total`)
      },
    })

    setRegisterResults(result)

    return () => {
      result.unregister()
    }
  }, [options])

  return { elementRef, registerResults }
}
