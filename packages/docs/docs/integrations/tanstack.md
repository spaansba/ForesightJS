---
sidebar_position: 3
keywords:
  - ForesightJS
  - TanStack Query
  - Prefetching
  - Data Fetching
  - React Query
description: Integration guide for using ForesightJS with TanStack Query for predictive data prefetching
last_updated:
  date: 2025-07-18
  author: Bart Spaans
---

# TanStack Query

ForesightJS integrates with TanStack Query to enable predictive data prefetching based on user mouse movements, keyboard navigation, and scroll patterns.

## Basic Integration

```bash
npm install js.foresight @tanstack/react-query
```

### Basic Hook

```tsx
import { useRef, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ForesightManager } from "js.foresight"

function useForesightPrefetch<T extends HTMLElement = HTMLElement>(
  queryKey: string[],
  queryFn: () => Promise<any>,
  options?: { hitSlop?: number; reactivateAfter?: number }
) {
  const elementRef = useRef<T>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!elementRef.current) return

    const { unregister } = ForesightManager.instance.register({
      element: elementRef.current,
      callback: async () => {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn,
          reactivateAfter: options?.reactivateAfter || 5 * 60 * 1000,
        })
      },
      hitSlop: options?.hitSlop || 20,
    })

    return unregister
  }, [queryKey, queryFn, options])

  return elementRef
}
```

### Usage Example

```tsx
import { useQuery } from "@tanstack/react-query"

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  })

  const linkRef = useForesightPrefetch<HTMLAnchorElement>(
    ["user", userId],
    () => fetchUser(userId),
    { hitSlop: 30, reactivateAfter: 10 * 60 * 1000 }
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>{data?.name}</h1>
      <Link ref={linkRef} to={`/users/${userId}/details`}>
        View Details
      </Link>
    </div>
  )
}
```

## Navigation Integration

### React Router

```tsx
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ForesightManager } from "js.foresight"

function ForesightNavLink({ to, queryKey, queryFn, children }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!linkRef.current) return

    const { unregister } = ForesightManager.instance.register({
      element: linkRef.current,
      callback: async () => {
        await queryClient.prefetchQuery({ queryKey, queryFn })
      },
      hitSlop: 20,
    })

    return unregister
  }, [queryKey, queryFn])

  return (
    <a 
      ref={linkRef}
      href={to}
      onClick={(e) => {
        e.preventDefault()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
```

## Best Practices

1. **Cache Awareness**: Check if data is already cached before prefetching
2. **Stale Time**: Set appropriate stale times to prevent unnecessary refetches
3. **Conditional Prefetching**: Only prefetch on good connections, not touch devices
4. **Error Handling**: Wrap prefetch logic in try-catch blocks
5. **Cleanup**: Always unregister ForesightJS elements when components unmount

## Native TanStack Router Integration

TanStack Router is planning native predictive prefetching. [See announcement by Tanner Linsley](https://x.com/tannerlinsley/status/1908723776650355111).

The native solution will likely provide better integration when available, but ForesightJS offers immediate benefits with proven algorithms and development tools for debugging and tuning.
