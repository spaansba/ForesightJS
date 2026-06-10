---
sidebar_position: 6
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React Router
  - Routing
  - React
  - PrefetchPageLinks
description: Integration details to add ForesightJS to your React Router projects
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# React Router

## React Router's Prefetching

React Router DOM (v6.4+) uses no prefetching by default. While you can enable prefetching with options like `intent` (hover/focus) or `viewport`, it doesnt have the same flexibility as ForesightJS. To add ForesightJS to React Router you can wrap the `Link` component.

## ForesightLink Component

Below is a wrapper around the React Router `Link` that prefetches with ForesightJS using the [`useForesight`](./useForesight.md) hook. The callback flips a flag that renders `PrefetchPageLinks` for the target route. On mobile devices ForesightJS falls back to the configured [`touchDeviceStrategy`](./configuration/global-settings.md#touch-device-settings).

```tsx
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import { useState } from "react"
import { Link, PrefetchPageLinks, type LinkProps } from "react-router"

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
  const [shouldPrefetch, setShouldPrefetch] = useState(false)
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => setShouldPrefetch(true),
    hitSlop,
    name,
    meta,
    reactivateAfter,
    enabled,
  })

  return (
    <>
      {shouldPrefetch && <PrefetchPageLinks page={props.to.toString()} />}
      <Link {...props} ref={elementRef} className={className}>
        {children}
      </Link>
    </>
  )
}
```

### Usage of ForesightLink

```tsx
export function Navigation() {
  return (
    <>
      <ForesightLink to={"/contact"} hitSlop={20} name="contact-link">
        contact
      </ForesightLink>
      <ForesightLink to={"/about"} name="about-link">
        about
      </ForesightLink>
    </>
  )
}
```
