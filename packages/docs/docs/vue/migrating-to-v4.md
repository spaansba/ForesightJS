---
keywords:
  - ForesightJS
  - migration
  - v4
  - Vue
  - Vue.js
  - "@foresightjs/vue"
description: Moving from the v3 copy-paste Vue directive and composable to the official @foresightjs/vue package
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import MigratingCore from '../\_partials/\_migrating-core.mdx';

# Migrating to v4

In v3 there was no Vue package - the docs handed you a directive and composable to copy into your own project. v4 replaces those with the official [`@foresightjs/vue`](./installation.md) package. Install it, delete your copied files, and update a couple of names.

Install the package and delete your hand-rolled `vForesight.ts` / `useForesight.ts`:

```bash
npm install @foresightjs/vue
```

## Directive

```diff
- import { vForesight } from "@/directives/vForesight"
+ import { vForesight } from "@foresightjs/vue"

  app.directive("foresight", vForesight)
```

The usage in your templates is unchanged.

## Composable

The composable lost the `templateRefKey` string. Instead it returns an `elementRef` function you bind directly:

```diff
- import { useForesight } from "./composables/useForesight"
+ import { useForesight } from "@foresightjs/vue"

- const { templateRef } = useForesight({ templateRefKey: "myButton", callback })
+ const { elementRef } = useForesight({ callback })
```

```diff
- <button ref="myButton">Hover</button>
+ <button :ref="elementRef">Hover</button>
```

You also get the [reactive state](./useForesight.md#reactive-state) back as refs instead of a `registerResults` object.

## Core changes

The core `js.foresight` library also has a few breaking changes. The package handles most of these for you, but they matter if you call `register()` or listen to events directly.

<MigratingCore />
