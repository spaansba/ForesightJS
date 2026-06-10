---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React
  - Hook
  - useForesights
  - "@foresightjs/react"
  - Multiple elements
description: Register a dynamic list of elements with the useForesights React hook
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# useForesights

`useForesights` is the list version of [`useForesight`](./useForesight.md). You can't call a hook in a loop, so when you're rendering a variable number of elements (a nav, search results, a grid) you hand `useForesights` an array of options and get back an array of results, one per item.

```tsx
import { useForesights } from "@foresightjs/react"

function Nav({ links }: { links: { href: string; label: string }[] }) {
  const foresights = useForesights<HTMLAnchorElement>(
    links.map(link => ({
      callback: () => prefetch(link.href),
      name: link.label,
    }))
  )

  return (
    <nav>
      {links.map((link, i) => (
        <a key={link.href} ref={foresights[i].elementRef} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  )
}
```

The result at index `i` lines up with the options at index `i`. Each one carries its own `elementRef` plus the same [reactive state](./useForesight.md#reactive-state) as the single hook, so you can drive per-item UI:

```tsx
<a ref={foresights[i].elementRef} href={link.href} data-predicted={foresights[i].isPredicted}>
  {link.label}
</a>
```

The array length can change between renders. Grow it and the new slots register when their refs attach; shrink it and the dropped slots unregister. Everything is cleaned up on unmount.
