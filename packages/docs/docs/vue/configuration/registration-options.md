---
keywords:
  - ForesightJS
  - JS.Foresight
  - Vue
  - Vue.js
  - "@foresightjs/vue"
  - element configuration
  - registration options
  - hitSlop
  - element metadata
description: The options you pass to the v-foresight directive and useForesight composable
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import ElementSettings from "../../\_partials/\_registration-options.mdx"

# Registration Options

In Vue, the registration options are what you pass to the [`v-foresight`](../directive.md) directive or the [`useForesight`](../useForesight.md) composable. The directive or `setRef` takes care of the element, so there is no `element` option. `callback` is the only required field.

```html
<script setup lang="ts">
  import { useForesight } from "@foresightjs/vue"

  const { setRef } = useForesight({
    callback: () => {
      // Required: Function that executes when interaction is predicted
      console.log("prefetching")
    },
    hitSlop: 50, // slop around the element, making its hitbox bigger
    name: "about-link", // name visible in the debug tools
    meta: {
      route: "/about",
    }, // your custom meta data for analytics
    reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
    enabled: true, // when false the element stays registered but inactive
  })
</script>

<template>
  <a :ref="setRef" href="/about">About</a>
</template>
```

The directive takes the same options object:

```html
<template>
  <button v-foresight="{ callback: handlePrefetch, hitSlop: 50, name: 'prefetch-button' }">
    Hover to prefetch
  </button>
</template>
```

When the options change, both the directive and the composable patch the existing registration in place.

<ElementSettings />
