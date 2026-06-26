---
keywords:
  - ForesightJS
  - JS.Foresight
  - Angular
  - Events
  - Foresight Events
  - injectForesightEvent
description: Listen to the built-in ForesightJS events from Angular
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

import Events from "../_partials/_events.mdx"

# Events

ForesightManager emits events to provide insight into element registration, prediction activity, and callback execution. These events are primarily used by the [ForesightJS DevTools](./devtools.md), but can also power telemetry, analytics, and counters in your Angular app.

## Usage

In Angular the easiest way to listen to events from a component, directive, or injectable context is [`injectForesightEvent`](./injectForesightEvent.md):

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

The standard `ForesightManager.instance.addEventListener` / `removeEventListener` pattern is also available if you want to listen outside Angular.

<Events />
