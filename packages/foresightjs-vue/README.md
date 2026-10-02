# @foresightjs/vue

[![npm version](https://img.shields.io/npm/v/@foresightjs/vue.svg)](https://www.npmjs.com/package/@foresightjs/vue)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/vue.svg)](https://www.npmjs.com/package/@foresightjs/vue)
[![core downloads](https://img.shields.io/npm/dt/js.foresight.svg?label=core%20downloads)](https://www.npmjs.com/package/js.foresight)

Official Vue 3 bindings for [ForesightJS](https://foresightjs.com/), a lightweight library that predicts user intent (mouse trajectory, keyboard navigation, scroll, touch) to trigger callbacks like prefetching _before_ the user interacts.

- **Docs:** [foresightjs.com/docs/vue/installation](https://foresightjs.com/docs/vue/installation)
- **Core library:** [`js.foresight`](https://www.npmjs.com/package/js.foresight)
- **Playground:** [foresightjs.com](https://foresightjs.com/#playground)

## Installation

```bash
pnpm add @foresightjs/vue js.foresight
# or
npm install @foresightjs/vue js.foresight
```

## What's included

- `v-foresight` -> directive to register an element with a callback or full options object
- `useForesight` -> register a single element and get reactive refs for its state
- `Foresight` -> component form of useForesight with a scoped slot
- `useForesightEvent` -> subscribe to a ForesightManager event for the lifetime of the calling scope

For usage and examples, see the [Vue documentation](https://foresightjs.com/docs/vue/installation).

## Quick start

Save this as `AboutLink.vue` and render `<AboutLink />` in your app:

```vue
<script setup lang="ts">
import { useForesight } from "@foresightjs/vue"

const { elementRef } = useForesight({
  callback: async () => {
    await fetch("/about")
  },
})
</script>

<template>
  <a :ref="elementRef" href="/about">About</a>
</template>
```

ForesightJS runs the callback when it predicts interaction with the link. Replace `fetch` with your router or data cache's prefetch function. Your app owns caching and navigation.

The composable registers when the template ref receives the element and unregisters when the scope is disposed.

### SSR and client initialization

The composable can run during [SSR](https://vuejs.org/guide/scaling-up/ssr.html). Registration waits for the DOM element in the browser.

The manager initializes automatically with defaults. For custom global settings, run this in your client entry before mounting or hydrating the app. Guard the call if that module also runs on the server:

```ts
import { ForesightManager } from "@foresightjs/vue"

if (typeof window !== "undefined") {
  ForesightManager.initialize({ defaultHitSlop: 20 })
}
```

`initialize()` uses settings only on its first call. Later changes go through `ForesightManager.instance.alterGlobalSettings()`.

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
