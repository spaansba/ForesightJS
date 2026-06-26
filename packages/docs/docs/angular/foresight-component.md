---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Angular
  - Component
  - ForesightComponent
  - "@foresightjs/angular"
description: Register a host element with the Foresight Angular component
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

# ForesightComponent

`ForesightComponent` registers its own host element and projects your content inside it. It is useful when you want a component-shaped wrapper instead of adding a directive to an existing element.

## Usage

```ts
import { Component } from "@angular/core"
import { ForesightComponent } from "@foresightjs/angular"

@Component({
  selector: "app-actions",
  standalone: true,
  imports: [ForesightComponent],
  template: `
    <foresight
      [callback]="prefetchCheckout"
      foresightName="checkout-wrapper"
      [hitSlop]="40"
      #foresight
    >
      <button>
        {{ foresight.state().isPredicted ? "Checkout ready" : "Checkout" }}
      </button>
    </foresight>
  `,
})
export class ActionsComponent {
  readonly prefetchCheckout = () => {
    void fetch("/api/checkout")
  }
}
```

The component accepts these inputs:

- `callback` (required)
- `foresightName`
- `hitSlop`
- `meta`
- `reactivateAfter`
- `enabled`

`foresightName` maps to the Foresight `name` option so native `name` attributes can still be used inside projected content.

## When to use the directive instead

Most Angular apps should use [`[fsForesight]`](./directive.md). It registers the exact DOM element you put it on and does not add a wrapper element. Use `ForesightComponent` when the wrapper itself is the target you want to track.
