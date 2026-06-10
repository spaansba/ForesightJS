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

ForesightManager emits various events to provide insight into element registration, prediction activities, and callback executions. These events are primarily used by the [ForesightJS DevTools](./devtools.md) for visual debugging and monitoring, but can also be leveraged for telemetry, analytics, and performance monitoring in your applications.

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
