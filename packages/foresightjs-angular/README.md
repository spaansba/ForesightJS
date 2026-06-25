# @foresightjs/angular

[![npm version](https://img.shields.io/npm/v/@foresightjs/angular.svg)](https://www.npmjs.com/package/@foresightjs/angular)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/angular.svg)](https://www.npmjs.com/package/@foresightjs/angular)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Official Angular bindings for [ForesightJS](https://foresightjs.com/), a lightweight library that predicts user intent (mouse trajectory, keyboard navigation, scroll, touch) to trigger callbacks like prefetching _before_ the user interacts.

- **Docs:** [foresightjs.com/docs/angular/installation](https://foresightjs.com/docs/angular/installation)
- **Core library:** [`js.foresight`](https://www.npmjs.com/package/js.foresight)
- **Playground:** [foresightjs.com](https://foresightjs.com/#playground)

## Installation

```bash
pnpm add @foresightjs/angular js.foresight
# or
npm install @foresightjs/angular js.foresight
```

Requires Angular 17+

## What's included

- `ForesightDirective` -> standalone `[fsForesight]` directive to register an element with a callback or full options object
- `ForesightService` -> injectable service for manual registration and manager event subscriptions
- `ForesightComponent` -> standalone wrapper component that registers its host element
- `injectForesightEvent` -> helper to subscribe to a ForesightManager event for the lifetime of the current injection context

## Directive usage

```ts
import { Component } from "@angular/core"
import { ForesightDirective } from "@foresightjs/angular"

@Component({
  standalone: true,
  imports: [ForesightDirective],
  template: `
    <a
      href="/pricing"
      [fsForesight]="prefetchPricing"
      fsForesightName="pricing-link"
      #foresight="foresight"
    >
      Pricing {{ foresight.state().isPredicted ? "(ready)" : "" }}
    </a>
  `,
})
export class NavComponent {
  readonly prefetchPricing = () => {
    void fetch("/api/pricing")
  }
}
```

For full options, bind an object:

```html
<button
  [fsForesight]="{
    callback: preloadCheckout,
    name: 'checkout',
    hitSlop: 40,
    enabled: isCheckoutEnabled
  }"
>
  Checkout
</button>
```

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
