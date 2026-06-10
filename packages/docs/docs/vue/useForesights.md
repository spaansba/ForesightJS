---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - Composable
  - useForesights
  - "@foresightjs/vue"
  - Multiple elements
description: Register a dynamic list of elements with the useForesights Vue composable
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# useForesights

`useForesights` is the list version of [`useForesight`](./useForesight.md). Hand it an array of options (usually a getter over your `v-for` data) and you get back a reactive array of slots, one per item. Each slot has its own `elementRef` and the same [reactive state](./useForesight.md#reactive-state) as the single composable.

```html
<script setup lang="ts">
  import { ref } from "vue"
  import { useForesights } from "@foresightjs/vue"

  const links = ref([
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ])

  const slots = useForesights(() =>
    links.value.map(link => ({
      callback: () => prefetch(link.href),
      name: link.label,
    }))
  )
</script>

<template>
  <a
    v-for="(link, i) in links"
    :key="link.href"
    :ref="slots[i].elementRef"
    :href="link.href"
    :class="{ predicted: slots[i].isPredicted }"
  >
    {{ link.label }}
  </a>
</template>
```

The slot at index `i` lines up with the options at index `i`. Because you pass a getter, the list stays in sync with your data: add items and the new slots register when their refs attach, remove items and the dropped slots unregister. Everything is cleaned up when the component is disposed.
