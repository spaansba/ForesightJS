---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Angular
  - Service
  - ForesightService
  - "@foresightjs/angular"
description: Manually register elements and listen to ForesightManager events with ForesightService
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

# ForesightService

`ForesightService` is the injectable Angular API underneath the directive and component. Use it when a directive is not a good fit, or when you want to register an element from lifecycle code.

## Register an element manually

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from "@angular/core"
import { ForesightService, type ForesightRegistration } from "@foresightjs/angular"

@Component({
  selector: "app-manual-prefetch",
  standalone: true,
  template: `<button #button>Checkout</button>`,
})
export class ManualPrefetchComponent implements AfterViewInit, OnDestroy {
  @ViewChild("button", { static: true }) button!: ElementRef<HTMLButtonElement>

  private readonly foresight = inject(ForesightService)
  private registration: ForesightRegistration | null = null

  ngAfterViewInit(): void {
    this.registration = this.foresight.register(this.button.nativeElement, {
      callback: () => void fetch("/api/checkout"),
      name: "checkout-button",
      hitSlop: 40,
    })
  }

  ngOnDestroy(): void {
    this.registration?.unregister()
  }
}
```

`register()` returns a `ForesightRegistration`:

- `state`: an Angular signal with the latest [`ForesightElementState`](./configuration/registration-options.md#state-fields)
- `update(options)`: patches the existing registration
- `unregister()`: removes the element from the manager
- `getSnapshot()`: reads the current state snapshot

## Update options

```ts
this.registration?.update({
  callback: () => void fetch("/api/checkout"),
  name: "checkout-button",
  enabled: this.canPrefetch(),
})
```

## Listen to manager events

Use `listen()` for app-level analytics or debugging outside a component injection context:

```ts
const stopListening = this.foresight.listen("callbackInvoked", event => {
  console.log("Prefetch started", event.state.name)
})

stopListening()
```

Inside a component, [`injectForesightEvent`](./injectForesightEvent.md) usually gives cleaner cleanup.
