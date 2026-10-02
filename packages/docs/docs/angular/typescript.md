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

import TypeScriptTypes from "../\_partials/\_typescript.mdx"

# TypeScript

`@foresightjs/angular` exports its binding types and common core types such as `ForesightElementState`, `ForesightCallback`, and `ForesightRegisterOptionsWithoutElement`:

```ts
import type { ForesightOptions, ForesightRegistration } from "@foresightjs/angular"
```

Other core types come from `js.foresight` directly:

```ts
import type { ElementBounds, ForesightRegisterResult, ForesightManagerData } from "js.foresight"
```

Angular prediction state is exposed as signals:

```ts
import type { ForesightStateSignal } from "@foresightjs/angular"

type Props = {
  state: ForesightStateSignal
}
```

<TypeScriptTypes />
