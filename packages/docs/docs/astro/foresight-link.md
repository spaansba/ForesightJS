---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - ForesightLink
  - component
  - "@foresightjs/astro"
description: The ForesightLink Astro component from @foresightjs/astro
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

# ForesightLink

`<ForesightLink>` is typed sugar over the [data attributes](./data-attributes.md). It renders a plain `<a>` with `data-astro-prefetch="foresight"` and the `data-foresight-*` attributes filled in from its props:

```html
---
import { ForesightLink } from "@foresightjs/astro/components"
---

<ForesightLink href="/pricing" hitSlop="{30}" name="pricing-cta">Pricing</ForesightLink>
```

## Props

Besides all regular `<a>` attributes it accepts the options from [`ForesightLinkOptions`](./typescript.md):

| Prop              | Type             | Description                                                |
| ----------------- | ---------------- | ---------------------------------------------------------- |
| `hitSlop`         | `number \| Rect` | Invisible margin around the link that expands its hit area |
| `name`            | `string`         | Debug name shown in the [devtools](./devtools.md)          |
| `reactivateAfter` | `number`         | Time in ms after which the link can trigger again          |
| `enabled`         | `boolean`        | Set to `false` to keep the link registered but inactive    |

```html
<ForesightLink
  href="/checkout"
  hitSlop={{ top: 20, right: 50, bottom: 20, left: 50 }}
  name="checkout-cta"
  reactivateAfter={30_000}
>
  Checkout
</ForesightLink>
```

Since it renders a regular anchor there is no client-side JavaScript involved, the injected foresight script picks the link up like any other.
