---
keywords:
  - ForesightJS
  - initialize
  - ForesightManager
  - configuration
  - setup
  - Vue
  - Vue.js
description: Initialize the ForesightManager with custom global settings in a Vue app (optional step)
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import InitializeTheManager from "../\_partials/\_initialize-the-manager.mdx"

# Initialize the Manager

:::info Optional Step
This step is **not needed** if you don't want to configure ForesightJS. The manager will initialize automatically with default settings the first time the directive or a composable registers an element.

If you don't want to configure anything, skip to [Quick Start](./quick-start.md).
:::

If you want to customize ForesightJS's global behavior, call `ForesightManager.initialize()` once in your `main.ts`, before mounting the app:

```ts
import { ForesightManager } from "@foresightjs/vue"
```

## Optional Settings

You can configure any of these [global settings](./configuration/global-settings.md).

<InitializeTheManager />

The manager also provides several static methods for inspecting which elements are registered, how many callbacks have run, and the registered [event](./events.md) listeners. You can find a list of these methods [here](./static-properties.md).
