---
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Astro
  - tutorial
  - getting started
description: Prefetch your first links with ForesightJS in Astro
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

# Quick Start

This guide walks through prefetching your first links with ForesightJS in Astro.

## Basic Usage Example

Add the integration to your Astro config. With `prefetchAll: true` and `defaultStrategy: "foresight"`, every internal link is prefetched when intent is predicted, no changes to your markup needed:

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
import foresight from "@foresightjs/astro"

export default defineConfig({
  integrations: [
    foresight({
      prefetchAll: true,
      defaultStrategy: "foresight",
    }),
  ],
})
```

Individual links can still use Astro's native strategies or opt out entirely:

```html
<a href="/about">About</a>
<!-- prefetched when intent is predicted -->
<a href="/docs" data-astro-prefetch="viewport">Docs</a>
<!-- Astro's own strategy -->
<a href="/big" data-astro-prefetch="false">Big page</a>
<!-- no prefetch at all -->
```

## Opt-in per link

Without `defaultStrategy: "foresight"`, only links that opt in explicitly are handled by foresight:

```html
<a href="/pricing" data-astro-prefetch="foresight">Pricing</a>
```

Astro's four native strategies (`tap`, `hover`, `viewport`, `load`) keep working exactly as before. See the [`foresight()` options](./integration.md) for how the two configs compose.

## Tuning individual links

Registration options are set per link with [data attributes](./data-attributes.md), or with the typed [`<ForesightLink>`](./foresight-link.md) component:

```html
<a href="/pricing" data-astro-prefetch="foresight" data-foresight-hit-slop="30">Pricing</a>
```

For custom callbacks instead of page prefetching, use [`registerForesight`](./register-foresight.md).

## Development Tools

ForesightJS has dedicated [Development Tools](./devtools.md) that help you understand and tune how prediction is working in your application. Install the package and enable the integration's `devtools` option to load them during `astro dev`:

```bash
pnpm add -D js.foresight-devtools
# or
npm install -D js.foresight-devtools
# or
yarn add -D js.foresight-devtools
```

```js
foresight({
  devtools: true,
})
```
