---
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
  date: 2025-11-30
  author: Bart Spaans
---

# Next.js

## Next.js default prefetching

Next.js's default prefetching method prefetches when links enter the viewport, this is a great user experience but can lead to unnecessary data transfer for bigger websites. For example by scrolling down the [Next.js homepage](https://nextjs.org/) it triggers **~1.59MB** of prefetch requests as every single link on the page gets prefetched, regardless of user intent.

To avoid this, we can wrap the `Link` component and add ForesightJS. The official Next.js [prefetching docs](https://nextjs.org/docs/app/guides/prefetching#extending-or-ejecting-link) mention ForesightJS as an example for custom prefetching strategies.

## ForesightLink Component

Below is an example of creating an wrapper around the Next.js `Link` component that prefetches with ForesightJS. On mobile devices ForesightJS uses the configured [`touchDeviceStrategy`](/docs/configuration/global-settings#touch-device-settings-v330). This implementation uses the `useForesight` react hook which can be found [here](/docs/react/hook).

```tsx
"use client"
import type { LinkProps } from "next/link"
import Link from "next/link"
import { type ForesightRegisterOptions } from "js.foresight"
import useForesight from "../hooks/useForesight"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">, Omit<ForesightRegisterOptions, "element" | "callback"> {
  children: React.ReactNode
  className?: string
}

export function ForesightLink({ children, className, ...props }: ForesightLinkProps) {
  const router = useRouter() // import from "next/navigation" not "next/router"
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      router.prefetch(props.href.toString())
    },
    hitSlop: props.hitSlop,
    name: props.name,
    meta: props.meta,
    reactivateAfter: props.reactivateAfter,
  })

  return (
    <Link {...props} ref={elementRef} className={className}>
      {children}
    </Link>
  )
}
```

## Basic Usage

```tsx
import ForesightLink from "./ForesightLink"
export default function Navigation() {
  return (
    <ForesightLink
      href="/home"
      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
      name="nav-home"
    >
      Home
    </ForesightLink>
  )
}
```

:::caution
If you dont see the correct prefetching behaviour make sure you are in production. Next.js only prefetches in production and not in development
:::
