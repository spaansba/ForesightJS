---
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - Events
  - Foresight Events
description: Listen to the built-in ForesightJS events from Astro
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import Events from "../\_partials/\_events.mdx"

# Events

ForesightManager emits events to provide insight into element registration, prediction activity, and callback execution. These events are primarily used by the [ForesightJS DevTools](./devtools.md), but can also power telemetry, analytics, and counters.

## Usage

In Astro you listen from a `<script>` tag using the standard `addEventListener` API on the manager instance:

```html
<script>
  import { ForesightManager } from "js.foresight"

  ForesightManager.instance.addEventListener("callbackInvoked", event => {
    console.log(`prefetching ${event.state.name}`)
  })
</script>
```

The integration initializes the manager before your page scripts run, so `ForesightManager.instance` is safe to use directly.

<Events />
