# @foresightjs/astro

Astro integration for [ForesightJS](https://foresightjs.com/). Prefetches pages when user intent is _predicted_ (mouse trajectory, tab navigation, scroll direction) instead of reacting to hover or viewport entry. Earlier than `hover`, far less wasteful than `viewport` or `load`.

It is configured exactly like Astro's [built-in prefetch](https://docs.astro.build/en/guides/prefetch/) and composes with it: the four native strategies keep working, foresight becomes the fifth.

## Install

```bash
npm install @foresightjs/astro js.foresight
```

## Usage

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

```html
<a href="/about">About</a>
<!-- foresight-predicted -->
<a href="/docs" data-astro-prefetch="viewport">Docs</a>
<!-- Astro's own strategy -->
<a href="/big" data-astro-prefetch="false">Big page</a>
<!-- no prefetch at all -->
```

Without `defaultStrategy: "foresight"`, only links that opt in explicitly are handled:

```html
<a href="/pricing" data-astro-prefetch="foresight">Pricing</a>
```

When a foresight-registered link's callback fires, the page is fetched through Astro's own `prefetch()` from `astro:prefetch`, so slow-connection detection, deduplication and the Speculation Rules upgrade (`experimental.clientPrerender`) all apply.

## Options

```js
foresight({
  // mirror Astro's prefetch config: native values are forwarded to Astro,
  // "foresight" hands unattributed links to foresight instead
  prefetchAll: true,
  defaultStrategy: "foresight",

  // forwarded to ForesightManager.initialize
  manager: {
    trajectoryPredictionTime: 120,
    defaultHitSlop: 0,
    touchDeviceStrategy: "viewport",
  },

  // base options for every registered link
  linkDefaults: { hitSlop: 10 },

  // selector-based overrides, later rules win
  rules: [
    { selector: "nav a", hitSlop: 30 },
    { selector: "footer a", enabled: false },
  ],

  // load js.foresight-devtools during `astro dev` (install it separately)
  devtools: true,
})
```

## Per-link data attributes

Data attributes win over `rules`, which win over `linkDefaults`:

```html
<a
  href="/pricing"
  data-astro-prefetch="foresight"
  data-foresight-hit-slop="10 40"
  data-foresight-name="pricing-cta"
  data-foresight-reactivate-after="30000"
  data-foresight-enabled="true"
  >Pricing</a
>
```

`data-foresight-hit-slop` uses CSS margin shorthand (1 to 4 values: top right bottom left).

## `<ForesightLink>` component

Typed sugar that renders a plain `<a>` with the attributes above:

```astro
---
import { ForesightLink } from "@foresightjs/astro/components"
---

<ForesightLink href="/pricing" hitSlop={30} name="pricing-cta">Pricing</ForesightLink>
```

## Client API

For custom callbacks or `meta` (options that can't be serialized into attributes):

```astro
<script>
  import { registerForesight } from "@foresightjs/astro/client"

  registerForesight("#load-more", {
    hitSlop: 40,
    meta: { section: "feed" },
    callback: () => fetchNextPage(),
  })
</script>
```

`registerForesight` accepts a selector or an element.

## How it interacts with Astro's prefetch

- The four native strategies (`tap`/`hover`/`viewport`/`load`) and the `astro:prefetch` module keep working. Native `prefetchAll` and `defaultStrategy` values are forwarded to Astro's own prefetch config.
- With `prefetchAll: true` and `defaultStrategy: "foresight"`, unattributed links are registered with foresight. Without `prefetchAll`, unattributed links are not prefetched at all, exactly like Astro's own config.
- A link opts into foresight either through `defaultStrategy: "foresight"` (unattributed links) or an explicit `data-astro-prefetch="foresight"`. A bare `data-astro-prefetch` attribute stays with Astro's own default strategy.
- On slow connections or data-saver mode, foresight links gracefully fall back to Astro's `tap` strategy.
- Links are re-scanned after view transitions and when anchors are injected or removed (server islands).
