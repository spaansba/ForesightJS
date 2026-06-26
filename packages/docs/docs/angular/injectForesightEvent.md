---
sidebar_position: 5
keywords:
  - ForesightJS
  - JS.Foresight
  - Angular
  - injectForesightEvent
  - events
  - "@foresightjs/angular"
description: Listen to ForesightManager events from an Angular injection context
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

# injectForesightEvent

This is meant for high-level, app-wide use cases like analytics, debugging, or a global prediction counter. `injectForesightEvent` subscribes to [`ForesightManager` events](./events.md) for the lifetime of the current Angular injection context.

```ts
import { Component, signal } from "@angular/core"
import { injectForesightEvent } from "@foresightjs/angular"

@Component({
  selector: "app-prefetch-counter",
  standalone: true,
  template: `<p>{{ hits() }} prefetches triggered</p>`,
})
export class PrefetchCounterComponent {
  readonly hits = signal(0)

  constructor() {
    injectForesightEvent("callbackInvoked", () => {
      this.hits.update(count => count + 1)
    })
  }
}
```

You don't need to remove the listener yourself. Angular destroys the subscription with the component, directive, service, or other injection context where the helper was called.

## Dynamic event type or listener

Pass Angular signals when the event type or listener needs to change over time:

```ts
readonly eventType = signal<"callbackInvoked" | "callbackCompleted">("callbackInvoked")

constructor() {
  injectForesightEvent(this.eventType, event => {
    console.log(event.type)
  })
}
```

For listeners outside an injection context, use [`ForesightService.listen`](./foresight-service.md#listen-to-manager-events).
