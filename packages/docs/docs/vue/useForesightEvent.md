---
sidebar_position: 5
keywords:
  - ForesightJS
  - JS.Foresight
  - Vue
  - Vue.js
  - Composable
  - useForesightEvent
  - events
  - "@foresightjs/vue"
description: Listen to ForesightManager events from a Vue component
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# useForesightEvent

This is meant for high-level, app-wide use cases (analytics, debugging, a global prediction counter), not per-element logic. `useForesightEvent` subscribes a component to the [`ForesightManager` events](./events.md). Pass the event name and a listener, and the composable adds and removes the listener for you.

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

You don't need to remove the listener yourself, the composable does it for you when the component is disposed.

See [Events](./events.md) for the full list of event names and their payloads.
