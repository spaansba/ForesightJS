---
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - Composable
  - useForesight
description: Vue composable for ForesightJS integration
last_updated:
  date: 2025-11-30
  author: Bart Spaans
---

# Composable

The `useForesight` composable provides a Vue-native way to integrate ForesightJS into your Vue components. Unlike the [`v-foresight` directive](/docs/vue/directive), the composable gives you direct access to [`registerResults`](/docs/configuration/element-settings#registration-return-value) and the element's [`templateRef`](https://vuejs.org/guide/essentials/template-refs), but requires more setup code.

## Basic useForesight

Copy belows code in a `/composables/useForesight.ts` file

```ts
import { ref, onMounted, useTemplateRef, readonly, type ComponentPublicInstance } from "vue"
import {
  ForesightManager,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightRegisterResult,
} from "js.foresight"

type UseForesightOptions = ForesightRegisterOptionsWithoutElement & {
  templateRefKey: string
}

export function useForesight<T extends HTMLElement | ComponentPublicInstance>(
  options: UseForesightOptions
) {
  const templateRef = useTemplateRef<T>(options.templateRefKey)

  const registerResults = ref<ForesightRegisterResult | null>(null)

  onMounted(() => {
    if (!templateRef.value) {
      return
    }

    // Extract the underlying HTMLElement if the templateRef is a Vue component
    const element =
      templateRef.value instanceof HTMLElement ? templateRef.value : templateRef.value.$el

    registerResults.value = ForesightManager.instance.register({
      element,
      ...options,
    })
  })

  return {
    templateRef,
    registerResults: readonly(registerResults),
  }
}
```

### Return Values

The composable returns an object containing:

- [`templateRef`](https://vuejs.org/guide/essentials/template-refs) - Template ref to attach to your target element using `ref="yourRefKey"`
- [`registerResults`](/docs/configuration/element-settings#registration-return-value) - Registration details like `isRegistered`

### Basic Usage

This is the most basic way to use the composable and is basically the same as using the [`v-foresight` directive](/docs/vue/directive).

```html
<script setup lang="ts">
  import { useForesight } from "./composables/useForesight"

  useForesight({
    templateRefKey: "myButton",
    callback: () => {
      console.log("Prefetching data...")
    },
    hitSlop: 10,
    name: "my-button",
  })
</script>

<template>
  <button ref="myButton">Hover to prefetch</button>
</template>
```

### Getting the [`templateRef`](https://vuejs.org/guide/essentials/template-refs)

The composable also returns the [`templateRef`](https://vuejs.org/guide/essentials/template-refs), giving you direct access to the underlying element or component instance.

```html
<script setup lang="ts">
  import { useForesight } from "./composables/useForesight"
  import MyCustomComponent from "./MyCustomComponent.vue"

  const { templateRef } = useForesight<InstanceType<typeof MyCustomComponent>>({
    templateRefKey: "myComponent", // Must match the ref attribute on your element
    callback: () => {
      console.log("Prefetching...")
    },
  })
</script>

<template>
  <MyCustomComponent ref="myComponent" />
</template>
```

:::note
When you want to access the [`templateRef`](https://vuejs.org/guide/essentials/template-refs) of a Vue component, you must pass `InstanceType<typeof YourComponent>` as the generic type parameter to get the correct component instance type. This is only necessary when destructuring [`templateRef`](https://vuejs.org/guide/essentials/template-refs) from the return value.
:::
