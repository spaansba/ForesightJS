---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - React
  - Hook
  - useForesightEvent
  - events
  - "@foresightjs/react"
description: Listen to ForesightManager events from a React component
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# useForesightEvent

This is meant for high-level, app-wide use cases (analytics, debugging, a global prediction counter), not per-element logic. `useForesightEvent` subscribes a component to the [`ForesightManager` events](./events.md). Pass the event name and a listener, and the hook handles adding and removing the listener for you.

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

The listener is always called with the latest closure, so you can reference state and props inside it without re-subscribing. You don't need to remove the listener yourself, the hook does it for you when the component unmounts (or when the event name changes).

See [Events](./events.md) for the full list of event names and their payloads.
