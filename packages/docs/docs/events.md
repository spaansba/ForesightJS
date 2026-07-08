---
sidebar_position: 6
keywords:
  - ForesightJS
  - js.foresight
  - js.foresight-debugger
  - Events
  - Foresight Events
description: Documentation on how to use the built-in js.foresight events
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import Events from "./\_partials/\_events.mdx"

# Events

ForesightManager emits events for element registration, prediction, and callback execution. The [ForesightJS DevTools](./debugging/devtools.md) use them for visual debugging, and you can listen to them yourself for telemetry, analytics, or counters.

## Usage

All events are visible in the logs tab of the [devtools](./debugging/devtools.md). However for tracking/analytics in production, implementing them in your own code is straightforward with the standard `addEventListener` pattern.

```typescript
import { ForesightManager } from "js.foresight"

// Define handler as const for removal
const handleCallbackCompleted = event => {
  console.log(
    `Callback executed for ${event.state.name} in ${event.hitType.kind} mode, which took ${event.elapsed} ms`
  )
}

// Add the event
ForesightManager.instance.addEventListener("callbackCompleted", handleCallbackCompleted)

// Later, remove the listener using the same reference
ForesightManager.instance.removeEventListener("callbackCompleted", handleCallbackCompleted)
```

### AbortController support

Event listeners support [AbortController signals](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for easy cleanup.

```typescript
const controller = new AbortController()

manager.addEventListener("callbackCompleted", handleCallbackCompleted, {
  signal: controller.signal,
})

controller.abort()
```

<Events />
