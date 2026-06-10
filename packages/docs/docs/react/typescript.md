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

ForesightJS is fully written in `TypeScript`, and all types are exported from `@foresightjs/react`:

```tsx
import type { ForesightRegisterOptionsWithoutElement } from "@foresightjs/react"
```

The hooks are generic over the element type, so the returned ref is correctly typed:

```tsx
const { elementRef } = useForesight<HTMLAnchorElement>({ callback })
```

<TypeScriptTypes />
