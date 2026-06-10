---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - Composable
  - useForesight
  - "@foresightjs/vue"
description: The useForesight Vue composable from @foresightjs/vue
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# useForesight

`useForesight` registers a single element and gives you back the element's reactive prediction state as refs, plus an `elementRef` function to bind to the element. Use it over the [`v-foresight`](./directive.md) directive when you want to read state like `isPredicted` in your template.

```html
<script setup lang="ts">
  import { useForesight } from "@foresightjs/vue"

  const { elementRef, isPredicted } = useForesight({
    callback: () => console.log("user is likely to click this"),
    name: "about-link",
    hitSlop: 10,
  })
</script>

<template>
  <a :ref="elementRef" href="/about" :class="{ predicted: isPredicted }">About</a>
</template>
```

Bind `elementRef` with `:ref="elementRef"` and the composable handles the rest: it registers the element when it mounts, unregisters it when the component is disposed, and re-registers if the element swaps. `elementRef` works on plain elements and on component instances (it pulls out the underlying element for you).

## Options

The options are the [registration options](./configuration/registration-options.md), minus the `element` (`elementRef` handles that). `callback` is the only required field.

To make options reactive, pass a getter instead of a plain object. The composable patches the registration in place when it changes:

```html
<script setup lang="ts">
  import { ref } from "vue"
  import { useForesight } from "@foresightjs/vue"

  const enabled = ref(true)

  const { elementRef } = useForesight(() => ({
    callback: () => prefetch("/about"),
    name: "about-link",
    enabled: enabled.value,
  }))
</script>
```

## Reactive state

Every [state](./configuration/registration-options.md#registration-return-value) field comes back as a reactive ref, so reading it in your template re-renders when it changes. The ones you'll reach for most:

- `isPredicted` → the callback has fired for this element
- `isActive` → eligible to fire (not disabled, not on a limited connection)
- `isCallbackRunning` → your (awaited) callback is mid-flight
- `hitCount`, `status`, `error` → how the last run went

```html
<script setup lang="ts">
  const { elementRef, isPredicted, isCallbackRunning } = useForesight({
    callback: async () => {
      await fetch("/api/about")
    },
    name: "about",
  })
</script>

<template>
  <a :ref="elementRef" href="/about" :class="{ predicted: isPredicted }">
    About <span v-if="isCallbackRunning">…</span>
  </a>
</template>
```
