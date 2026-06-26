---
keywords:
  - ForesightJS
  - JS.Foresight
  - Typescript
  - Angular
  - "@foresightjs/angular"
description: Typescript helpers for ForesightJS in Angular
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

import TypeScriptTypes from "../_partials/_typescript.mdx"

# TypeScript

ForesightJS is fully written in `TypeScript`, and all core and Angular helper types are exported from `@foresightjs/angular`:

```ts
import type { ForesightOptions, ForesightRegistration } from "@foresightjs/angular"
```

Angular prediction state is exposed as signals:

```ts
import type { ForesightStateSignal } from "@foresightjs/angular"

type Props = {
  state: ForesightStateSignal
}
```

<TypeScriptTypes />
