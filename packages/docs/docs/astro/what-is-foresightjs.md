---
keywords:
  - Introduction
  - JS.Foresight
  - ForesightManager
  - Astro
  - mouse prediction
  - tab prediction
description: Introduction to ForesightJS for Astro, a lightweight library that predicts user intent based on mouse movements and keyboard navigation
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import WhatIsIntro from "../\_partials/\_what-is-intro.mdx"
import WhatIsBody from "../\_partials/\_what-is-body.mdx"

# What is ForesightJS

<WhatIsIntro />

In Astro you use ForesightJS through the official `@foresightjs/astro` integration. It plugs into Astro's [built-in prefetch](https://docs.astro.build/en/guides/prefetch/) as a fifth strategy: instead of prefetching on hover or viewport entry, links are prefetched the moment user intent is predicted.

## Installation

```bash
npm install @foresightjs/astro js.foresight
```

Continue with [Installation](./installation.md) and the [Quick Start](./quick-start.md).

<WhatIsBody />
