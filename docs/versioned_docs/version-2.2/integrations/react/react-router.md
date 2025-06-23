---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React Router
  - Routing
  - React
description: Integration details to add ForesightJS to your React Router projects
last_updated:
  date: 2025-06-23
  author: Bart Spaans
---

# React Router

## React Router's Prefetching

React Router DOM (v6.4+) uses no prefetching by default. While you can enable prefetching with options like `intent` (hover/focus) or `viewport`, it doesnt have the same flexibility as ForesightJS. To add ForesightJS to React Router you can create a `ForesightLink` component wrapping the `Link` component.

## ForesightLink Component

Below is an example of creating an wrapper around the React Router `Link` component that prefetches with ForesightJS. Since ForesightJS does nothing on touch devices we use the return of the `register()` function to use the default React Router prefetch mode. This implementation uses the `useForesight` react hook which can be found [here](/docs/next/integrations/react/useForesight).

```tsx
"use client"
import { ForesightManager, type ForesightRect } from "js.foresight"
import { useEffect, useRef, useState } from "react"
import { Link, useFetcher, type LinkProps } from "react-router"
import useForesight from "../hooks/useForesight"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">,
    Omit<ForesightRegisterOptions, "element" | "callback"> {
  children: React.ReactNode
  className?: string
}

export function ForesightLink({
  children,
  className,
  hitSlop = 0,
  unregisterOnCallback = true,
  name = "",
  ...props
}: ForesightLinkProps) {
  const fetcher = useFetcher()

  const { elementRef, registerResults } = useForesight<HTMLAnchorElement>({
    callback: () => {
      if (fetcher.state === "idle" && !fetcher.data) {
        fetcher.load(props.to.toString())
      }
    },
    hitSlop: hitSlop,
    name: name,
    unregisterOnCallback: unregisterOnCallback,
  })

  return (
    <Link
      {...props}
      prefetch={registerResults?.isTouchDevice ? "render" : "none"}
      ref={elementRef}
      className={className}
    >
      {children}
    </Link>
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
