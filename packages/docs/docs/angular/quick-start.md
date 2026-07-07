---
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Angular
  - first element
  - tutorial
  - getting started
description: Register your first element with ForesightJS in Angular using the fsForesight directive
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

# Quick Start

This guide walks through registering your first element with ForesightJS in Angular and reading its prediction state.

## Basic Usage Example

The simplest way to register an element is the [`[fsForesight]`](./directive.md) directive. Import the standalone directive, put it on an element, and give it a callback:

```ts
import { Component } from "@angular/core"
import { ForesightDirective } from "@foresightjs/angular"

@Component({
  selector: "app-nav",
  standalone: true,
  imports: [ForesightDirective],
  template: ` <button [fsForesight]="prefetchPricing">Pricing</button> `,
})
export class NavComponent {
  readonly prefetchPricing = () => {
    void fetch("/api/pricing")
  }
}
```

That's it.

:::note Unregistration is automatic
The directive registers the element when it appears and unregisters it when it is destroyed, so you never have to call `unregister()` yourself. The same applies to [`ForesightComponent`](./foresight-component.md).
:::

## Provide registration options

If you want more control, pass a full options object instead of just a callback:

```html
<button
  [fsForesight]="{
    callback: prefetchCheckout,
    hitSlop: 50,
    name: 'checkout-button',
    meta: { route: '/checkout' },
    reactivateAfter: 5 * 60 * 1000,
    enabled: isCheckoutEnabled
  }"
>
  Checkout
</button>
```

See [registration options](./configuration/registration-options.md) for the full list.

## Reading prediction state

Export the directive as `foresight` to read its Angular signal state in the template:

```html
<a
  href="/pricing"
  [fsForesight]="prefetchPricing"
  fsForesightName="pricing-link"
  #foresight="foresight"
>
  {{ foresight.state().isPredicted ? "Pricing ready" : "Pricing" }}
</a>
```

## Development Tools

ForesightJS has dedicated [Development Tools](./devtools.md) that help you understand and tune how prediction is working in your application:

```bash
pnpm add js.foresight-devtools
# or
npm install js.foresight-devtools
# or
yarn add js.foresight-devtools
```

```ts
import { ForesightDevtools } from "js.foresight-devtools"

ForesightDevtools.initialize({
  // optional props
})
```
