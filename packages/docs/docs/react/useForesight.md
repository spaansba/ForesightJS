---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React
  - Hook
  - useForesight
  - "@foresightjs/react"
description: The useForesight React hook from @foresightjs/react
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# useForesight

`useForesight` registers a single element with the [`ForesightManager`](./initialize-the-manager.md) and gives you back a ref to attach plus the element's reactive prediction state.

```tsx
import { useForesight } from "@foresightjs/react"

function PrefetchButton() {
  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: () => {
      // your prefetch logic
      console.log("user is likely to click this")
    },
    name: "prefetch-button",
    hitSlop: 10,
  })

  return <button ref={elementRef}>Hover to prefetch</button>
}
```

Attach `elementRef` and you're done. The hook registers the element once it mounts, unregisters it on unmount, and re-registers automatically if the node behind the ref swaps out.

## Options

The options object is the [registration options](./configuration/registration-options.md), minus the `element` (the ref handles that). `callback` is the only required field.

```tsx
useForesight({
  callback: () => prefetch("/about"),
  name: "about-link", // shown in the devtools
  hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
  meta: { route: "/about" },
  reactivateAfter: 5 * 60 * 1000,
  enabled: true,
})
```

You can change these on every render. The hook patches the existing registration in place.

## Reactive state

Everything other than `elementRef` on the return value is the element's current [state](./configuration/registration-options.md#registration-return-value), and it re-renders your component when it changes. The ones you'll reach for most:

- `isPredicted` → the callback has fired for this element
- `isActive` → eligible to fire (not disabled, not on a limited connection, not parked)
- `isParked` → detached from the DOM and parked; resumes when it reconnects
- `isCallbackRunning` → your (awaited) callback is mid-flight
- `hitCount`, `status`, `error` → how the last run went

Use it to reflect prediction in the UI:

```tsx
function PrefetchLink() {
  const { elementRef, isPredicted, isCallbackRunning } = useForesight<HTMLAnchorElement>({
    callback: async () => {
      await fetch("/api/about")
    },
    name: "about",
  })

  return (
    <a
      ref={elementRef}
      href="/about"
      style={{ outline: isPredicted ? "1px solid orange" : undefined }}
    >
      About {isCallbackRunning && "…"}
    </a>
  )
}
```

## Framework integrations

For ready-made link components built on this hook, see [Next.js](./nextjs.md) and [React Router](./react-router.md).
