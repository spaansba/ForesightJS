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
  author: Bart Spaans
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

### Return Values

The hook returns an object containing:

- `elementRef` - To attach to your target element
- [`registerResults`](/docs/getting_started/config#return-value-of-register) - Registration details like `isRegistered`

**Important:** Due to React's rendering lifecycle, both `elementRef` and `registerResults` will be `null` during the initial render. The element gets registered only after the component mounts and the ref is attached.

This means while implementing fallback prefetching logic, don't check if `registerResults` is `null`. Instead, always check the registration status using `registerResults.isRegistered` or device capabilities like `registerResults.isTouchDevice` and `registerResults.isLimitedConnection`.

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
