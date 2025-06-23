---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
description: Integration details to add ForesightJS to your Vue projects
last_updated:
  date: 2025-06-23
  author: Bart Spaans
---

# Vue

Vue integration examples coming soon. ForesightJS works with any framework or vanilla JavaScript.

## Basic Usage

```vue
<template>
  <button ref="buttonRef" @click="handleClick">Prefetch on Intent</button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { ForesightManager } from "js.foresight"

const buttonRef = ref(null)
let unregister = null

onMounted(() => {
  if (buttonRef.value) {
    const result = ForesightManager.instance.register({
      element: buttonRef.value,
      callback: () => {
        console.log("Prefetching...")
        // Your prefetch logic here
      },
      hitSlop: 20,
      name: "vue-button",
    })

    unregister = result.unregister
  }
})

onUnmounted(() => {
  if (unregister) {
    unregister()
  }
})

const handleClick = () => {
  console.log("Button clicked!")
}
</script>
```
