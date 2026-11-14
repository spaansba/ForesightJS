---
sidebar_position: 5
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Next.js
  - NextJS
  - Routing
  - Router
  - React
description: Integration details to add ForesightJS to your Next.js projects
last_updated:
  date: 2026-11-14
  author: Bart Spaans
---

# Next.js

## Next.js default prefetching

By default, Next.js prefetches each `Link` as it enters the viewport. On pages with many links this means a prefetch request for every visible link, regardless of user intent. The opt-in [Partial Prefetching](https://nextjs.org/docs/app/guides/prefetching#partial-prefetching) mode (`partialPrefetching`, requires `cacheComponents`) reduces this to one shared shell per route.

ForesightJS prefetches only the links a user is predicted to click. It starts before the cursor reaches the link, which is earlier than hover prefetching, and it also prefetches for keyboard users navigating with Tab.

To use it, wrap the `Link` component and add ForesightJS. The official Next.js [prefetching docs](https://nextjs.org/docs/app/guides/prefetching#extending-or-ejecting-link) mention ForesightJS as an example for custom prefetching strategies.

## ForesightLink Component

Below is a wrapper around the Next.js `Link` component that prefetches with ForesightJS using the [`useForesight`](./useForesight.md) hook. We disable Next's own prefetching (`prefetch={false}`) and prefetch from the callback instead. On mobile devices ForesightJS falls back to the configured [`touchDeviceStrategy`](./configuration/global-settings.md#touch-device-settings).

This wrapper accepts string `href` values. Include query parameters in the string, for example `"/products?category=books"`.

```tsx
"use client"
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends
    Omit<LinkProps, "prefetch" | "href">,
    Omit<ForesightRegisterOptionsWithoutElement, "callback"> {
  href: string
  children: React.ReactNode
  className?: string
}

export function ForesightLink({
  children,
  className,
  hitSlop,
  name,
  meta,
  reactivateAfter,
  enabled,
  ...props
}: ForesightLinkProps) {
  const router = useRouter() // import from "next/navigation" not "next/router"
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => router.prefetch(props.href),
    hitSlop,
    name,
    meta,
    reactivateAfter,
    enabled,
  })

  return (
    <Link {...props} ref={elementRef} prefetch={false} className={className}>
      {children}
    </Link>
  )
}
```

## Basic Usage

```tsx
import { ForesightLink } from "./ForesightLink"

export default function Navigation() {
  return (
    <ForesightLink href="/home" name="nav-home">
      Home
    </ForesightLink>
  )
}
```

:::caution
If you don't see the correct prefetching behaviour make sure you are in production. Next.js only prefetches in production, not in development.
:::
