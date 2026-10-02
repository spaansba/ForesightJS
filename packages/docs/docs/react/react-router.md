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

This example requires React Router v7 in [Framework Mode](https://reactrouter.com/7.18.4/start/modes#framework). Its `Link` supports `prefetch="intent"` and `prefetch="viewport"`, and `PrefetchPageLinks` can prefetch a route when ForesightJS predicts intent.

`PrefetchPageLinks` requires framework context and cannot be used under a plain `BrowserRouter` or standalone `RouterProvider`. In those apps, put your own data fetch or route-module import in the Foresight callback instead.

## ForesightLink Component

Below is a wrapper around the React Router `Link` that prefetches with ForesightJS using the [`useForesight`](./useForesight.md) hook. The callback flips a flag that renders `PrefetchPageLinks` for the target route. On mobile devices ForesightJS falls back to the configured [`touchDeviceStrategy`](./configuration/global-settings.md#touch-device-settings).

```tsx
import { useForesight, type ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
import { useState } from "react"
import { createPath, Link, PrefetchPageLinks, useResolvedPath, type LinkProps } from "react-router"

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
  const page = createPath(useResolvedPath(props.to, { relative: props.relative }))
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
      {shouldPrefetch && <PrefetchPageLinks page={page} />}
      <Link {...props} ref={elementRef} prefetch="none" className={className}>
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
