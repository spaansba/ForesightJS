---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - data attributes
  - hitSlop
  - "@foresightjs/astro"
description: Configure individual links with data-foresight-* attributes
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

# Data Attributes

Individual links are configured with `data-foresight-*` attributes, the same way Astro's own prefetch uses `data-astro-prefetch`. Data attributes win over [`rules`](./integration.md#rules), which win over [`linkDefaults`](./integration.md#linkdefaults).

```html
<a
  href="/pricing"
  data-astro-prefetch="foresight"
  data-foresight-hit-slop="10 40"
  data-foresight-name="pricing-cta"
  data-foresight-reactivate-after="30000"
  data-foresight-enabled="true"
>
  Pricing
</a>
```

If you prefer typed props over attributes, use the [`<ForesightLink>`](./foresight-link.md) component, which renders exactly this.

## Available options

These map to the core [registration options](./configuration/registration-options.md) of the same name:

| Attribute                         | Type             | Description                                                  |
| --------------------------------- | ---------------- | ------------------------------------------------------------ |
| `data-foresight-hit-slop`         | margin shorthand | Invisible margin around the link that expands its hit area   |
| `data-foresight-name`             | string           | Debug name shown in the [devtools](./devtools.md) and events |
| `data-foresight-reactivate-after` | number (ms)      | Time after which the link can trigger again                  |
| `data-foresight-enabled`          | boolean          | Set to `"false"` to keep the link registered but inactive    |

`data-foresight-hit-slop` uses CSS margin shorthand with 1 to 4 values (top right bottom left):

```html
<a data-foresight-hit-slop="20">…</a>
<!-- 20 on all sides -->
<a data-foresight-hit-slop="10 40">…</a>
<!-- 10 top/bottom, 40 left/right -->
<a data-foresight-hit-slop="10 40 20 5">…</a>
<!-- top right bottom left -->
```

The `callback` is always Astro's `prefetch()` for the link's `href`. For a custom callback or `meta` (options that can't be serialized into attributes), use [`registerForesight`](./register-foresight.md).
