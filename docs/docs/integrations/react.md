---
sidebar_position: 2
---

# React Router

## React Router's Prefetching

React Router DOM (v6.4+) includes a `prefetch` prop on its `<Link>` component to control when route modules and data (from `loader` functions) are preloaded:

- **`none` (default):** No prefetching.
- **`intent`:** Prefetches on hover or focus.
- **`render`:** Prefetches when the link renders.
- **`viewport`:** Prefetches when the link enters the viewport.

### ForesightJS benefits within React Router

ForesightJS enhances this with a more **predictive** approach. By analyzing mouse trajectory in real-time, it can:

- **Initiate prefetching earlier than `intent` (on hover/focus)** if cursor movement indicates an imminent click.
- **Be less wasteful than `render` or `viewport`** by targeting only links with high user intent, rather than prefetching everything that renders or scrolls into view.

---

## ForesightLink Component

You can integrate ForesightJS with React Router in various ways. Below is an example of creating a `ForesightLink` component that wraps React Router's `Link`. It uses `ForesightManager` to predict intent and `useFetcher` to prefetch route data.

Since ForesightJS's trajectory prediction requires a cursor, the component falls back to prefetching on render for touch devices.

```tsx
import { ForesightManager, type ForesightRect } from "js.foresight"
import { useEffect, useRef, useState } from "react"
import { Link, useFetcher, type LinkProps } from "react-router"

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
  const fetcher = useFetcher()
  const linkRef = useRef<HTMLAnchorElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    if (!linkRef.current) {
      return
    }

    const { isTouchDevice, unregister } = ForesightManager.instance.register({
      element: linkRef.current,
      callback: () => {
        if (fetcher.state === "idle" && !fetcher.data) {
          fetcher.load(props.to.toString())
        }
      },
      hitSlop,
      unregisterOnCallback,
      name,
    })

    setIsTouchDevice(isTouchDevice)

    return () => {
      unregister()
    }
  }, [linkRef])

  return (
    <Link
      ref={linkRef}
      {...props}
      prefetch={isTouchDevice ? "render" : "none"}
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
