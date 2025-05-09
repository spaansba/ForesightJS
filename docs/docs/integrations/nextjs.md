---
sidebar_position: 1
---

# Next.js

## The Problem with Default Next.js Prefetching

Next.js automatically prefetches links as they enter the viewport, which can lead to significant unnecessary data transfer:

- Scrolling up and down on the [Next.js homepage](https://nextjs.org/) can trigger **~1.59MB** of prefetch requests
- Every link in the viewport gets prefetched, regardless of user intent
- This can waste bandwidth and server resources on mobile devices or slower connections

## ForesightJS Solution: Predictive Prefetching

ForesightJS optimizes prefetching by only triggering for links the user is likely to click based on mouse movement:

- Only prefetches when the user's cursor trajectory indicates intent
- Dramatically reduces unnecessary network requests
- Maintains the performance benefits of prefetching for actual user interactions

## ForesightLink Component

```tsx
// components/ForesightLink.tsx
"use client"
import type { LinkProps } from "next/link"
import Link from "next/link"
import React, { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ForesightManager } from "js.foresight"
type ForesightPrefetch = "foresight"

interface ForesightLinkProps extends Omit<LinkProps, "prefetch"> {
  children: React.ReactNode
  prefetch?: boolean | null | ForesightPrefetch
  className?: string
}

function ForesightLink({ children, prefetch, className, ...props }: ForesightLinkProps) {
  if (prefetch !== "foresight") {
    return (
      <Link {...props} prefetch={prefetch}>
        {children}
      </Link>
    )
  } else {
    return (
      <Foresight {...props} className={className}>
        {children}
      </Foresight>
    )
  }
}

function Foresight({ children, className, ...props }: ForesightLinkProps) {
  const LinkRef = useRef<HTMLAnchorElement>(null)

  const router = useRouter()

  // instead of this useEffect you can also use the useForesight React hook (see React integrations)
  useEffect(() => {
    if (!LinkRef.current) {
      return
    }
    const callBack = () => router.prefetch(props.href.toString())
    const unregister = ForesightManager.instance.register(LinkRef.current, callBack)

    return unregister
  }, [LinkRef, router, props.href])
  return (
    <Link {...props} prefetch={false} ref={LinkRef} className={className}>
      {children}
    </Link>
  )
}

export default ForesightLink
```

**Use ForesightLink in Your Navigation**

```tsx
import ForesightLink from "./ForesightLink"

export default function Navigation() {
  return (
    <nav>
      <ForesightLink href="/" prefetch="foresight">
        Home
      </ForesightLink>
      <ForesightLink href="/products" prefetch="foresight">
        Products
      </ForesightLink>
      <ForesightLink href="/contact" prefetch="foresight">
        Contact
      </ForesightLink>
    </nav>
  )
}
```

## Benefits Over Standard Prefetching

- **Bandwidth Efficiency**: Only prefetches routes the user is likely to visit
- **Reduced Server Load**: Minimizes unnecessary API calls and data fetching
- **Better Mobile Experience**: Conserves data for users on metered connections
- **Same Performance Benefits**: Still provides instant navigation for intended clicks

By replacing the default "prefetch everything visible" approach with ForesightJS's intelligent prediction, you get the best of both worlds: the performance benefits of prefetching with the efficiency of only loading what's needed.
