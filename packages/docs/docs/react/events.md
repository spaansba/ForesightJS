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

ForesightManager emits events for element registration, prediction, and callback execution. The [ForesightJS DevTools](./devtools.md) use them for visual debugging, and you can listen to them yourself for telemetry, analytics, or counters.

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
