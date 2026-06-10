---
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - first element
  - tutorial
  - getting started
description: Register your first element with ForesightJS in Vue using the v-foresight directive or the useForesight composable
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

# Quick Start

This guide will walk you through registering your first element with ForesightJS in Vue and understanding how the prediction system works.

## Basic Usage Example

The simplest way to register an element is the [`v-foresight`](./directive.md) directive. Put it on an element and give it a callback (this is where your prefetching logic goes):

```html
<script setup lang="ts">
  import { vForesight } from "@foresightjs/vue"

  function handlePrefetch() {
    // This is where your prefetching logic goes
    console.log("User is likely to interact with this element!")
  }
</script>

<template>
  <button v-foresight="handlePrefetch">Hover to prefetch</button>
</template>
```

Thats it!

:::note Unregistration is automatic
The directive registers the element when it mounts and unregisters it when it unmounts, so you never have to call `unregister()` yourself. The same goes for the `useForesight` composable below.
:::

## Provide registration options

However if you want to add a bit more power to your element you can pass a full options object instead of just a callback:

```html
<template>
  <button
    v-foresight="{
      callback: handlePrefetch,
      hitSlop: 50, // slop around the element, making its hitbox bigger
      name: 'My Foresight button!', // name visible in the debug tools
      meta: {
        route: '/about',
      }, // your custom meta data for analytics
      reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
    }"
  >
    Hover to prefetch
  </button>
</template>
```

See [registration options](./configuration/registration-options.md) for the full list.

## Reading prediction state

When you want to read the element's prediction state (for example to style a link once it's prefetched), use the [`useForesight`](./useForesight.md) composable instead. It returns the state as reactive refs plus an `elementRef` function to bind to the element:

```html
<script setup lang="ts">
  import { useForesight } from "@foresightjs/vue"

  const { elementRef, isPredicted } = useForesight({
    callback: () => console.log("User is likely to interact with this element!"),
    name: "about-link",
  })
</script>

<template>
  <a :ref="elementRef" href="/about" :class="{ predicted: isPredicted }">About</a>
</template>
```

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
