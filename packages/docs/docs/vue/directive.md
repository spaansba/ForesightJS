---
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - Directive
  - v-foresight
description: Vue directive for ForesightJS integration
last_updated:
  date: 2025-11-30
  author: Bart Spaans
---

# Directive

The `v-foresight` directive provides a simple, declarative way to add ForesightJS prefetching to your Vue applications. Unlike the [`useForesight` composable](/docs/vue/composable), the directive offers a cleaner API with less setup code, but doesn't provide access to [`registerResults`](/docs/configuration/element-settings#registration-return-value) or the element's `templateRef`. It's ideal for most use cases where you don't need these advanced features.

## Basic v-foresight

Copy belows code in a `/directives/vForesight.ts` file

```ts
import type { Directive } from "vue"
import { ForesightManager, type ForesightRegisterOptionsWithoutElement } from "js.foresight"

type ForesightDirectiveValue = ForesightRegisterOptionsWithoutElement | (() => void)

export const vForesight: Directive<HTMLElement, ForesightDirectiveValue> = {
  mounted(element, binding) {
    const value = binding.value

    const options: ForesightRegisterOptionsWithoutElement =
      typeof value === "function" ? { callback: value } : value

    ForesightManager.instance.register({
      element,
      ...options,
    })
  },
}
```

### Register the directive globally

Register the directive in your `main.ts` like so:

```ts
import { vForesight } from "@/directives/vForesight"

app.directive("foresight", vForesight)
```

## Basic Usage

The directive can be used in two ways: with a callback function or with a full options object.

### Simple Callback

For basic use cases, pass a callback function directly:

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

### With Options

For more control, you can pass an options object with any [Element Settings](/docs/configuration/element-settings).

```html
<script setup lang="ts">
  function handlePrefetch() {
    console.log("Prefetching...")
  }
</script>

<template>
  <button
    v-foresight="{
      callback: handlePrefetch,
      hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
      name: 'button-with-options',
      reactivateAfter: 3000,
    }"
  ></button>
</template>
```
