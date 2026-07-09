---
keywords:
  - ForesightJS
  - JS.Foresight
  - Typescript
  - Astro
  - "@foresightjs/astro"
description: Typescript helpers for ForesightJS in Astro
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import TypeScriptTypes from "../\_partials/\_typescript.mdx"

# TypeScript

ForesightJS is fully written in `TypeScript`. The Astro package exports its own types:

```ts
import type {
  ForesightAstroOptions, // everything foresight() accepts
  ForesightClientOptions, // the same minus `devtools`
  ForesightLinkOptions, // per-link options (hitSlop, name, reactivateAfter, enabled)
  ForesightRule, // ForesightLinkOptions plus a `selector`
  AstroPrefetchStrategy, // Astro's native strategy names
} from "@foresightjs/astro"
```

Core types come from `js.foresight` directly:

<TypeScriptTypes />
