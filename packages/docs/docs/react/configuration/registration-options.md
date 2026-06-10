---
keywords:
  - ForesightJS
  - JS.Foresight
  - React
  - "@foresightjs/react"
  - element configuration
  - registration options
  - hitSlop
  - element metadata
description: The options you pass to the useForesight React hook
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import ElementSettings from "../../\_partials/\_registration-options.mdx"

# Registration Options

In React, the registration options are the object you pass to the [`useForesight`](../useForesight.md) hook. The hook's ref takes care of the element, so there is no `element` option. `callback` is the only required field.

```tsx
import { useForesight } from "@foresightjs/react"

function AboutLink() {
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: () => {
      // Required: Function that executes when interaction is predicted
      console.log("prefetching")
    },
    hitSlop: 50, // slop around the element, making its hitbox bigger
    name: "about-link", // name visible in the debug tools
    meta: {
      route: "/about",
    }, // your custom meta data for analytics
    reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
    enabled: true, // when false the element stays registered but inactive
  })

  return (
    <a ref={elementRef} href="/about">
      About
    </a>
  )
}
```

You can change these options on every render - the hook patches the existing registration in place. The exception is `hitSlop`, which is fixed at registration.

<ElementSettings />
