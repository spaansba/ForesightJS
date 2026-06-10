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
  date: 2026-06-08
  author: Bart Spaans
---

# Next.js

## Next.js default prefetching

Next.js's default prefetching method prefetches when links enter the viewport, this is a great user experience but can lead to unnecessary data transfer for bigger websites. For example by scrolling down the [Next.js homepage](https://nextjs.org/) it triggers **~1.59MB** of prefetch requests as every single link on the page gets prefetched, regardless of user intent.

To avoid this, we can wrap the `Link` component and add ForesightJS. The official Next.js [prefetching docs](https://nextjs.org/docs/app/guides/prefetching#extending-or-ejecting-link) mention ForesightJS as an example for custom prefetching strategies.

## ForesightLink Component

Below is a wrapper around the Next.js `Link` component that prefetches with ForesightJS using the [`useForesight`](./useForesight.md) hook. We disable Next's own prefetching (`prefetch={false}`) and prefetch from the callback instead. On mobile devices ForesightJS falls back to the configured [`touchDeviceStrategy`](./configuration/global-settings.md#touch-device-settings).

```tsx
"use client"
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import Link, { type LinkProps } from "next/link"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">, Omit<ForesightRegisterOptionsWithoutElement, "callback"> {
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
    callback: () => router.prefetch(props.href.toString()),
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
If you dont see the correct prefetching behaviour make sure you are in production. Next.js only prefetches in production and not in development
:::
