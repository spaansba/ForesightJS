---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Angular
  - Directive
  - fsForesight
  - "@foresightjs/angular"
description: The fsForesight Angular directive from @foresightjs/angular
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

# fsForesight

`[fsForesight]` is the simplest way to add predictive callbacks to an Angular app. Put it on an element, give it a callback or an options object, and it registers, updates, and unregisters the element for you.

## Import the directive

`ForesightDirective` is standalone, so import it directly in the component that uses it:

```ts
import { Component } from "@angular/core"
import { ForesightDirective } from "@foresightjs/angular"

@Component({
  standalone: true,
  imports: [ForesightDirective],
  template: `<button [fsForesight]="prefetch">Prefetch</button>`,
})
export class ExampleComponent {
  readonly prefetch = () => {
    void fetch("/api/example")
  }
}
```

## Callback shorthand

```html
<button [fsForesight]="handlePrefetch">Hover to prefetch</button>
```

The callback receives the element's [`ForesightElementState`](./configuration/registration-options.md#state-fields).

## With options

For more control, pass any [registration options](./configuration/registration-options.md):

```html
<button
  [fsForesight]="{
    callback: handlePrefetch,
    hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
    name: 'button-with-options',
    reactivateAfter: 3000,
    enabled: isEnabled()
  }"
>
  Hover to prefetch
</button>
```

If the bound value changes, the directive patches the existing registration in place rather than tearing it down, so flipping `enabled` or changing `hitSlop` keeps the same element tracked.

## Individual inputs

You can also pass common options through inputs:

```html
<a
  href="/docs"
  [fsForesight]="prefetchDocs"
  fsForesightName="docs-link"
  [fsForesightHitSlop]="40"
  [fsForesightMeta]="{ route: '/docs' }"
  [fsForesightEnabled]="isDocsEnabled()"
>
  Docs
</a>
```

Object options and individual inputs are resolved into the same registration options. If you need a native `name` attribute, use `fsForesightName` for the Foresight debug name.

## Reading state

The directive exports itself as `foresight`:

```html
<button [fsForesight]="prefetch" #foresight="foresight">
  {{ foresight.state().isCallbackRunning ? "Prefetching" : "Checkout" }}
</button>
```

`state` is an Angular signal containing the latest immutable [`ForesightElementState`](./configuration/registration-options.md#state-fields).
