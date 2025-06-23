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

# useForesight Hook

The `useForesight` hook provides a clean React way to integrate ForesightJS with your components.

## Basic Usage

```tsx
import { useRef, useEffect } from "react"
import { ForesightManager, type ForesightRect } from "js.foresight"

interface UseForesightOptions {
  callback: () => void
  hitSlop?: number | ForesightRect
  unregisterOnCallback?: boolean
  name?: string
}

function useForesight(options: UseForesightOptions) {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const { unregister } = ForesightManager.instance.register({
      element: elementRef.current,
      ...options,
    })

    return unregister
  }, [options.callback, options.hitSlop, options.unregisterOnCallback, options.name])

  return elementRef
}

export default useForesight
```

## Example Component

```tsx
import useForesight from "./useForesight"

function PrefetchButton() {
  const buttonRef = useForesight({
    callback: () => {
      console.log("Prefetching data...")
      // Your prefetch logic here
    },
    hitSlop: 20,
    name: "prefetch-button",
  })

  return (
    <button ref={buttonRef}>
      Hover to prefetch
    </button>
  )
}
```

## Advanced Hook with State

```tsx
import { useRef, useEffect, useState } from "react"
import { ForesightManager, type ForesightRect } from "js.foresight"

interface UseForesightOptions {
  callback: () => void
  hitSlop?: number | ForesightRect
  unregisterOnCallback?: boolean
  name?: string
}

function useForesight(options: UseForesightOptions) {
  const elementRef = useRef<HTMLElement>(null)
  const [isPrefetched, setIsPrefetched] = useState(false)

  useEffect(() => {
    if (!elementRef.current) return

    const { unregister } = ForesightManager.instance.register({
      element: elementRef.current,
      callback: () => {
        setIsPrefetched(true)
        options.callback()
      },
      hitSlop: options.hitSlop,
      unregisterOnCallback: options.unregisterOnCallback,
      name: options.name,
    })

    return unregister
  }, [options.callback, options.hitSlop, options.unregisterOnCallback, options.name])

  return { elementRef, isPrefetched }
}
```