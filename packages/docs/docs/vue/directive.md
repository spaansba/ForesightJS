---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - Directive
  - v-foresight
  - "@foresightjs/vue"
description: The v-foresight Vue directive from @foresightjs/vue
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# v-foresight

`v-foresight` is the simplest way to add prefetching to a Vue app. Put it on an element, give it a callback (or an options object), and it registers and unregisters the element for you. Reach for the [`useForesight`](./useForesight.md) composable instead when you need the element's prediction state.

## Register the directive

Register it globally once in your `main.ts`:

```ts
import { createApp } from "vue"
import { vForesight } from "@foresightjs/vue"
import App from "./App.vue"

createApp(App).directive("foresight", vForesight).mount("#app")
```

Or import it into a single component and use it locally:

```html
<script setup lang="ts">
  import { vForesight } from "@foresightjs/vue"
</script>
```

## Usage

The directive takes either a callback function or a full options object.

### Callback shorthand

```html
<script setup lang="ts">
  function handlePrefetch() {
    console.log("Prefetching...")
  }
</script>

<template>
  <button v-foresight="handlePrefetch">Hover to prefetch</button>
</template>
```

### With options

For more control, pass any [registration options](./configuration/registration-options.md):

```html
<template>
  <button
    v-foresight="{
      callback: handlePrefetch,
      hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
      name: 'button-with-options',
      reactivateAfter: 3000,
    }"
  >
    Hover to prefetch
  </button>
</template>
```

If the bound value changes, the directive patches the existing registration in place rather than tearing it down, so things like flipping `enabled` or growing the `hitSlop` keep the same element tracked.
