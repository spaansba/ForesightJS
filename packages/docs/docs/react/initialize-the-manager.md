---
keywords:
  - ForesightJS
  - initialize
  - ForesightManager
  - configuration
  - setup
  - React
description: Initialize the ForesightManager with custom global settings in a React app (optional step)
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import InitializeTheManager from "../\_partials/\_initialize-the-manager.mdx"

# Initialize the Manager

:::info Optional Step
This step is **not needed** if you don't want to configure ForesightJS. The manager will initialize automatically with default settings the first time a hook registers an element.

If you don't want to configure anything, skip to [Quick Start](./quick-start.md).
:::

If you want to customize ForesightJS's global behavior, call `ForesightManager.initialize()` once at your application's entry point (e.g. `main.tsx`, or a top-level layout in Next.js), before your components render.:

```tsx
import { ForesightManager } from "@foresightjs/react"
```

## Optional Settings

You can configure any of these [global settings](./configuration/global-settings.md).

<InitializeTheManager />

The manager also provides several static methods you can use to get information about which elements are registered, how many callbacks have been ran and all the listening [event](./events.md) listeners. You can find a list of these methods [here](./static-properties.md).
