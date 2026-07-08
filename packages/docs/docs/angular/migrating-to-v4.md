---
keywords:
  - ForesightJS
  - migration
  - v4
  - Angular
  - "@foresightjs/angular"
description: Moving from the v3 copy-paste Angular directive to the official @foresightjs/angular package
last_updated:
  date: 2026-06-z26
  author: Bart Spaans
---

import MigratingCore from "../\_partials/\_migrating-core.mdx"

# Migrating to v4

In v3 the Angular docs handed you a directive to copy into your own project. v4 replaces that with the official [`@foresightjs/angular`](./installation.md) package. Install it, delete your copied directive, and import the standalone directive from the package.

```bash
npm install @foresightjs/angular js.foresight
```

```diff
- import { ForesightDirective } from "./directives/foresight.directive"
+ import { ForesightDirective } from "@foresightjs/angular"
```

The directive selector is `[fsForesight]`:

```html
<a href="/pricing" [fsForesight]="prefetchPricing">Pricing</a>
```

For reactive state, export the directive as `foresight` and read its signal:

```html
<button [fsForesight]="prefetchCheckout" #foresight="foresight">
  {{ foresight.state().isPredicted ? "Ready" : "Checkout" }}
</button>
```

## Core changes

The core `js.foresight` library also has a few breaking changes. The package handles most of these for you, but they matter if you call `register()` or listen to events directly.

<MigratingCore />
