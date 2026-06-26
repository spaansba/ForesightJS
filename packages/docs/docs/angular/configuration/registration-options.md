---
keywords:
  - ForesightJS
  - JS.Foresight
  - Angular
  - "@foresightjs/angular"
  - element configuration
  - registration options
  - hitSlop
  - element metadata
description: The options you pass to the fsForesight directive, ForesightService, and ForesightComponent
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

import ElementSettings from "../../_partials/_registration-options.mdx"

# Registration Options

In Angular, registration options are what you pass to the [`[fsForesight]`](../directive.md) directive, [`ForesightService.register`](../foresight-service.md), or [`ForesightComponent`](../foresight-component.md). The directive, service, or component takes care of the element, so there is no `element` option. `callback` is the only required field.

```ts
import { Component } from "@angular/core"
import { ForesightDirective } from "@foresightjs/angular"

@Component({
  standalone: true,
  imports: [ForesightDirective],
  template: `
    <a
      href="/about"
      [fsForesight]="{
        callback: prefetchAbout,
        hitSlop: 50,
        name: 'about-link',
        meta: { route: '/about' },
        reactivateAfter: 5 * 60 * 1000,
        enabled: true
      }"
    >
      About
    </a>
  `,
})
export class AboutLinkComponent {
  readonly prefetchAbout = () => {
    void fetch("/api/about")
  }
}
```

When options change, the Angular integration patches the existing registration in place.

<ElementSettings />
