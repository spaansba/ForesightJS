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

ForesightJS can be easily integrated into Vue.js applications. Here are examples showing how to use ForesightJS with Vue 3's Composition API.

## Installation

```bash
npm install js.foresight
# or
pnpm add js.foresight
# or
yarn add js.foresight
```

## Basic Usage

Here's a basic example using Vue 3's Composition API:

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

## Router Integration

For Vue Router integration, you can prefetch routes when users show intent to navigate:

```vue
<template>
  <nav>
    <router-link 
      v-for="route in routes" 
      :key="route.path"
      :to="route.path"
      :ref="el => setRouteRef(el, route.path)"
      class="nav-link"
    >
      {{ route.name }}
    </router-link>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { ForesightManager } from "js.foresight"

const router = useRouter()
const routeRefs = ref(new Map())
const unregisterFunctions = ref(new Map())

const routes = [
  { path: "/home", name: "Home" },
  { path: "/about", name: "About" },
  { path: "/contact", name: "Contact" }
]

const setRouteRef = (el, path) => {
  if (el) {
    routeRefs.value.set(path, el)
  }
}

onMounted(() => {
  // Register each route link for prefetching
  routes.forEach(route => {
    const element = routeRefs.value.get(route.path)
    if (element) {
      const result = ForesightManager.instance.register({
        element: element.$el, // Access the actual DOM element
        callback: () => {
          // Prefetch the route
          console.log(`Prefetching route: ${route.path}`)
          router.prefetch(route.path)
        },
        name: `route-${route.path}`,
      })

      unregisterFunctions.value.set(route.path, result.unregister)
    }
  })
})

onUnmounted(() => {
  // Clean up all registrations
  unregisterFunctions.value.forEach(unregister => unregister())
  unregisterFunctions.value.clear()
  routeRefs.value.clear()
})
</script>
```

## Composable Hook

You can create a reusable Vue composable for ForesightJS:

```javascript
// composables/useForesight.js
import { ref, onMounted, onUnmounted } from "vue"
import { ForesightManager } from "js.foresight"

export function useForesight(callback, options = {}) {
  const elementRef = ref(null)
  const unregister = ref(null)

  onMounted(() => {
    if (elementRef.value) {
      const result = ForesightManager.instance.register({
        element: elementRef.value,
        callback,
        ...options
      })

      unregister.value = result.unregister
    }
  })

  onUnmounted(() => {
    if (unregister.value) {
      unregister.value()
    }
  })

  return {
    elementRef
  }
}
```

Then use it in your components:

```vue
<template>
  <button ref="elementRef" @click="handleClick">
    Smart Prefetch Button
  </button>
</template>

<script setup>
import { useForesight } from "@/composables/useForesight"

const { elementRef } = useForesight(
  () => {
    console.log("User shows intent to click!")
    // Your prefetch logic here
  },
  { 
    hitSlop: 15,
    name: "smart-button"
  }
)

const handleClick = () => {
  console.log("Button was clicked!")
}
</script>
```
