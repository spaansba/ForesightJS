---
keywords:
  - ForesightJS
  - JS.Foresight
  - React
  - Events
  - Foresight Events
  - useForesightEvent
description: Listen to the built-in ForesightJS events from React
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import Events from "../\_partials/\_events.mdx"

# Events

ForesightManager emits various events to provide insight into element registration, prediction activities, and callback executions. These events are primarily used by the [ForesightJS DevTools](./devtools.md) for visual debugging and monitoring, but can also be leveraged for telemetry, analytics, and performance monitoring in your applications.

## Usage

In React the easiest way to listen to events is the [`useForesightEvent`](./useForesightEvent.md) hook, which adds and removes the listener for you:

```tsx
import { useState } from "react"
import { useForesightEvent } from "@foresightjs/react"

function PrefetchCounter() {
  const [hits, setHits] = useState(0)

  useForesightEvent("callbackInvoked", event => {
    setHits(count => count + 1)
  })

  return <p>{hits} prefetches triggered</p>
}
```

The standard `ForesightManager.instance.addEventListener` / `removeEventListener` pattern is also available if you want to listen outside of a component.

<Events />
