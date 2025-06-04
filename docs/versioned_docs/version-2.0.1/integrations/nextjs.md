---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Next.JS
  - NextJS
  - Routing
  - Router
description: Integration details to add ForesightJS to your NextJS projects
last_updated:
  date: 2025-06-04
  author: spaansba
---

# Next.js

## The Problem with Default Next.js Prefetching

Next.js automatically prefetches links as they enter the viewport, which can lead to significant unnecessary data transfer. For example by scrolling down the [Next.js homepage](https://nextjs.org/) it triggers **~1.59MB** of prefetch requests as every single link on the page gets prefetched, regardless of user intent. This wastes bandwidth and server resources.

## ForesightJS Solution: Predictive Prefetching

ForesightJS optimizes prefetching by only triggering for links the user is likely to click based on mouse movement:

- Only prefetches when the user's cursor trajectory indicates intent
- Dramatically reduces unnecessary network requests
- Maintains the performance benefits of prefetching for actual user interactions

## ForesightLink Component

ForesightJS can be implemented within NextJS in many ways. Below is an example of creating an wrapper around the Next.JS Link component that prefetches with ForesightJS. Since ForesightJS does nothing on touch devices we use the return of the `register()` function to use the default Next.JS prefetch mode (which prefetches everything in the viewport).

```tsx
"use client"
import type { LinkProps } from "next/link"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ForesightManager, type ForesightRect } from "js.foresight"
import { useRouter } from "next/navigation"

interface ForesightLinkProps extends Omit<LinkProps, "prefetch"> {
  children: React.ReactNode
  className?: string
  hitSlop?: number | ForesightRect
  unregisterOnCallback?: boolean
  name?: string
}

export function ForesightLink({
  children,
  className,
  hitSlop = 0,
  unregisterOnCallback = true,
  name = "",
  ...props
}: ForesightLinkProps) {
  const LinkRef = useRef<HTMLAnchorElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const router = useRouter() // import from "next/navigation" not "next/router"

  useEffect(() => {
    if (!LinkRef.current) {
      return
    }

    const { unregister, isTouchDevice } = ForesightManager.instance.register({
      element: LinkRef.current,
      callback: () => router.prefetch(props.href.toString()),
      hitSlop,
      name,
      unregisterOnCallback,
    })

    setIsTouchDevice(isTouchDevice)

    return () => {
      unregister()
    }
  }, [LinkRef, router, props.href, hitSlop, name])

  return (
    <Link {...props} prefetch={isTouchDevice} ref={LinkRef} className={className}>
      {children}
    </Link>
  )
}
```

:::caution
If you dont see the correct prefetching behaviour make sure you are in production. Next.JS only prefetches in production and not in development
:::
