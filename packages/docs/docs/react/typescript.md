---
keywords:
  - ForesightJS
  - JS.Foresight
  - Typescript
  - React
description: Typescript helpers for ForesightJS in React
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import TypeScriptTypes from "../\_partials/\_typescript.mdx"

# TypeScript

`@foresightjs/react` exports its binding types and common core types such as `ForesightElementState`, `ForesightCallback`, and `ForesightRegisterOptionsWithoutElement`:

```tsx
import type { ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
```

Other core types come from `js.foresight` directly:

```ts
import type { ElementBounds, ForesightRegisterResult, ForesightManagerData } from "js.foresight"
```

The hooks are generic over the element type, so the returned ref is correctly typed:

```tsx
const { elementRef } = useForesight<HTMLAnchorElement>({ callback })
```

<TypeScriptTypes />
