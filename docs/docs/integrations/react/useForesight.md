---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React
  - Hook
  - useForesight
description: React hook for ForesightJS integration
last_updated:
  date: 2025-06-23
  author: spaansba
---

# useForesight

The `useForesight` hook serves as the base for all ForesightJS usage with any React framework.

## useForesight

```tsx
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
      ...options,
    })

    return () => {
      registerResults.current?.unregister()
    }
  }, [options])

  return { elementRef, registerResults: registerResults.current }
}
```

### Basic Usage

```TS
import useForesight from "./useForesight"

function MyComponent() {
  const { elementRef, registerResults } = useForesight<HTMLButtonElement>({
    callback: () => {
      console.log("Prefetching data...")
      // Your prefetch logic here
    },
    hitSlop: 10,
    name: "my-button",
  })

  return <button ref={elementRef}>Hover to prefetch</button>
}
```

### Framework Integrations

For ready-to-use components built on top of useForesight, see our framework-specific integrations:

- [React Router](/docs/integrations/react/react-router#foresightlink-component)
- [Next.js](/docs/integrations/react/nextjs#foresightlink-component)
