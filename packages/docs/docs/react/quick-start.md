---
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React
  - first element
  - tutorial
  - getting started
description: Register your first element with ForesightJS in React using the useForesight hook
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

# Quick Start

This guide will walk you through registering your first element with ForesightJS in React and understanding how the prediction system works.

## Basic Usage Example

In React you register an element with the [`useForesight`](./useForesight.md) hook. Give it a callback and attach the returned `elementRef` to the element you want to track:

```tsx
import { useForesight } from "@foresightjs/react"

function PrefetchButton() {
  const { elementRef } = useForesight<HTMLButtonElement>({
    callback: () => {
      // This is where your prefetching logic goes
      console.log("User is likely to interact with this element!")
    },
  })

  return <button ref={elementRef}>Hover to prefetch</button>
}
```

Thats it!

:::note Unregistration is automatic
The hook registers the element when it mounts and unregisters it when the component unmounts, so you never have to call `unregister()` yourself.
:::

## Provide registration options

However if you want to add a bit more power to your element you can give it the following props:

```tsx
import { useForesight } from "@foresightjs/react"

function AboutLink() {
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      console.log("User is likely to interact with this element!")
    },
    hitSlop: 50, // slop around the element, making its hitbox bigger
    name: "My Foresight button!", // name visible in the debug tools
    meta: {
      route: "/about",
    }, // your custom meta data for analytics
    reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
  })

  return (
    <a ref={elementRef} href="/about">
      About
    </a>
  )
}
```

See [registration options](./configuration/registration-options.md) for the full list. The hook also returns the element's reactive prediction state (`isPredicted`, `isActive`, …); read about it in [useForesight](./useForesight.md#reactive-state).

## Development Tools

ForesightJS has dedicated [Development Tools](./devtools.md) that help you understand and tune how prediction is working in your application:

```bash
pnpm add js.foresight-devtools
# or
npm install js.foresight-devtools
# or
yarn add js.foresight-devtools
```

```javascript
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize development tools
ForesightDevtools.initialize({
  // optional props
})
```
