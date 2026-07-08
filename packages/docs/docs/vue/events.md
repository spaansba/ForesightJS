---
keywords:
  - ForesightJS
  - JS.Foresight
  - Vue
  - Vue.js
  - Events
  - Foresight Events
  - useForesightEvent
description: Listen to the built-in ForesightJS events from Vue
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import Events from "../\_partials/\_events.mdx"

# Events

ForesightManager emits events for element registration, prediction, and callback execution. The [ForesightJS DevTools](./devtools.md) use them for visual debugging, and you can listen to them yourself for telemetry, analytics, or counters.

## Usage

In Vue the easiest way to listen to events is the [`useForesightEvent`](./useForesightEvent.md) composable, which adds and removes the listener for you:

```html
<script setup lang="ts">
  import { ref } from "vue"
  import { useForesightEvent } from "@foresightjs/vue"

  const hits = ref(0)

  useForesightEvent("callbackInvoked", () => {
    hits.value++
  })
</script>

<template>
  <p>{{ hits }} prefetches triggered</p>
</template>
```

The standard `ForesightManager.instance.addEventListener` / `removeEventListener` pattern is also available if you want to listen outside of a component.

<Events />
