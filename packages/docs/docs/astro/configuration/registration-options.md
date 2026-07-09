---
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - "@foresightjs/astro"
  - element configuration
  - registration options
  - hitSlop
  - element metadata
description: How the core registration options map to the Astro integration
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import ElementSettings from "../../\_partials/\_registration-options.mdx"

# Registration Options

In Astro the integration registers links for you, so you usually don't touch these options directly. The `element` is the anchor itself and the `callback` is Astro's `prefetch()` for the link's `href`. The remaining options are set per link through [data attributes](../data-attributes.md), [`linkDefaults`, or `rules`](../integration.md#options):

- `hitSlop` via `data-foresight-hit-slop`
- `name` via `data-foresight-name`
- `reactivateAfter` via `data-foresight-reactivate-after`
- `enabled` via `data-foresight-enabled`

For a custom `callback` or `meta`, register manually with [`registerForesight`](../register-foresight.md), which takes the full options below (minus `element`).

<ElementSettings />
