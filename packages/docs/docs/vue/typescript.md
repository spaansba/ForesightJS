---
keywords:
  - ForesightJS
  - JS.Foresight
  - Typescript
  - Vue
  - Vue.js
description: Typescript helpers for ForesightJS in Vue
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import TypeScriptTypes from "../\_partials/\_typescript.mdx"

# TypeScript

`@foresightjs/vue` exports its binding types and common core types such as `ForesightElementState`, `ForesightCallback`, and `ForesightRegisterOptionsWithoutElement`:

```ts
import type { ForesightRegisterOptionsWithoutElement } from "@foresightjs/vue"
```

Other core types come from `js.foresight` directly:

```ts
import type { ElementBounds, ForesightRegisterResult, ForesightManagerData } from "js.foresight"
```

<TypeScriptTypes />
