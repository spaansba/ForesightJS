---
sidebar_position: 1
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

ForesightJS can be implemented within NextJS in many ways. Below is an example of creating an wrapper around the NextJS Link component that allows the use of "foresight" as prefetch option.

```tsx
interface ForesightLinkProps extends Omit<LinkProps, "prefetch"> {
  children: React.ReactNode
  className?: string
  hitSlop?: number | ForesightRect
  name?: string
}

export function ForesightLink({
  children,
  className,
  hitSlop = 0,
  name,
  ...props
}: ForesightLinkProps) {
  const LinkRef = useRef<HTMLAnchorElement>(null)

  const router = useRouter()

  useEffect(() => {
    if (!LinkRef.current) {
      return
    }
    const callback = () => router.prefetch(props.href.toString())
    const unregister = ForesightManager.instance.register(LinkRef.current, callback, hitSlop, name)

    return unregister()
  }, [LinkRef, router, props.href, hitSlop, name])

  return (
    <Link {...props} prefetch={false} ref={LinkRef} className={className}>
      {children}
    </Link>
  )
}
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
