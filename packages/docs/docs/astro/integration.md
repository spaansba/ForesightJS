---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Astro
  - integration
  - "@foresightjs/astro"
description: All options of the foresight() Astro integration and how it composes with Astro's built-in prefetch
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

# foresight()

`foresight()` is the integration you add to `astro.config.mjs`. It is configured exactly like Astro's [built-in prefetch](https://docs.astro.build/en/guides/prefetch/) and composes with it: the four native strategies keep working, foresight becomes the fifth.

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

### `prefetchAll`

- **Type:** `boolean`

Mirrors Astro's `prefetch.prefetchAll`: also prefetch links without a `data-astro-prefetch` attribute, using `defaultStrategy`. Without it, unattributed links are not prefetched at all, exactly like Astro's own config.

### `defaultStrategy`

- **Type:** `"tap" | "hover" | "viewport" | "load" | "foresight"`

Strategy for links covered by `prefetchAll`. Native values (`tap`, `hover`, `viewport`, `load`) are forwarded to Astro's `prefetch.defaultStrategy`. `"foresight"` makes foresight register those links itself. Links with a native or bare `data-astro-prefetch` attribute always stay with Astro's own script.

### `manager`

- **Type:** `Partial<UpdateForsightManagerSettings>`

[Global settings](./configuration/global-settings.md) forwarded to `ForesightManager.initialize`. See [Initialize the Manager](./initialize-the-manager.md).

### `linkDefaults`

- **Type:** `ForesightLinkOptions`

Base link options applied to every link the integration registers:

```ts
type ForesightLinkOptions = {
  hitSlop?: HitSlop
  name?: string
  reactivateAfter?: number
  enabled?: boolean
}
```

These are the same options the [data attributes](./data-attributes.md#available-options) set per link.

### `rules`

- **Type:** `ForesightRule[]`

Selector-based overrides on top of `linkDefaults`. A rule is `ForesightLinkOptions` plus the CSS `selector` it applies to:

```ts
type ForesightRule = ForesightLinkOptions & {
  selector: string
}
```

Rules are applied in declaration order, later rules win, and [`data-foresight-*` attributes](./data-attributes.md) win over all rules.

### `devtools`

- **Type:** `boolean`

Loads the [Development Tools](./devtools.md) during `astro dev`. The `js.foresight-devtools` package is an optional peer dependency, install it separately.

## Which links get registered

A link is handled by foresight when either:

- it has an explicit `data-astro-prefetch="foresight"` attribute, or
- it has no `data-astro-prefetch` attribute at all and you configured `prefetchAll: true` with `defaultStrategy: "foresight"`.

Only same-origin links are registered. When a registered link's callback fires, the page is fetched through Astro's own `prefetch()` from `astro:prefetch`, so slow-connection detection, deduplication, and the Speculation Rules upgrade (`experimental.clientPrerender`) all apply.

## How it composes with Astro's prefetch

- The four native strategies and the `astro:prefetch` module keep working. Native `prefetchAll` and `defaultStrategy` values are forwarded to Astro's own prefetch config.
- On slow connections or data-saver mode, foresight links gracefully fall back to Astro's `tap` strategy.
- Links are re-scanned after view transitions and when anchors are injected or removed (server islands), so dynamically added links register automatically.
