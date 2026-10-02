# @foresightjs/react

[![npm version](https://img.shields.io/npm/v/@foresightjs/react.svg)](https://www.npmjs.com/package/@foresightjs/react)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/react.svg)](https://www.npmjs.com/package/@foresightjs/react)
[![core downloads](https://img.shields.io/npm/dt/js.foresight.svg?label=core%20downloads)](https://www.npmjs.com/package/js.foresight)

Official React bindings for [ForesightJS](https://foresightjs.com/), a lightweight library that predicts user intent (mouse trajectory, keyboard navigation, scroll, touch) to trigger callbacks like prefetching _before_ the user interacts.

- **Docs:** [foresightjs.com/docs/react/installation](https://foresightjs.com/docs/react/installation)
- **Core library:** [`js.foresight`](https://www.npmjs.com/package/js.foresight)
- **Playground:** [foresightjs.com](https://foresightjs.com/#playground)

## Installation

```bash
pnpm add @foresightjs/react js.foresight
# or
npm install @foresightjs/react js.foresight
```

## What's included

- `useForesight` -> register a single element and get its live state plus a callback ref to bind it
- `Foresight` -> component form of useForesight, rendering an element with `as` or accepting a render prop
- `useForesightEvent` -> subscribe to a ForesightManager event for the lifetime of the component

For usage and examples, see the [React documentation](https://foresightjs.com/docs/react/installation), including guides for [Next.js](https://foresightjs.com/docs/react/nextjs) and [React Router](https://foresightjs.com/docs/react/react-router).

## Quick start

```tsx
"use client"

import { useForesight } from "@foresightjs/react"

export function AboutLink() {
  const { elementRef } = useForesight<HTMLAnchorElement>({
    callback: async () => {
      await fetch("/about")
    },
  })

  return (
    <a ref={elementRef} href="/about">
      About
    </a>
  )
}
```

Render `<AboutLink />` in your app. ForesightJS runs the callback when it predicts interaction with the link. Replace `fetch` with your router or data cache's prefetch function. Your app owns caching and navigation.

The hook registers after mount and unregisters on unmount.

### SSR and client initialization

The hook can render during SSR. Registration happens in a client effect. Frameworks using [React Server Components](https://react.dev/reference/rsc/use-client) need the `"use client"` directive shown above.

The manager initializes automatically with defaults. For custom global settings, initialize in your browser entry or an imported client setup module before components mount. Guard the call if that module also runs on the server:

```ts
"use client"

import { ForesightManager } from "@foresightjs/react"

if (typeof window !== "undefined") {
  ForesightManager.initialize({ defaultHitSlop: 20 })
}
```

`initialize()` uses settings only on its first call. A parent effect may run after child registrations, so configure before mounting instead. Later changes go through `ForesightManager.instance.alterGlobalSettings()`.

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
