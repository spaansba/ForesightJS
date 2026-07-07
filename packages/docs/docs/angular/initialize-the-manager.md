---
keywords:
  - ForesightJS
  - initialize
  - ForesightManager
  - configuration
  - setup
  - Angular
description: Initialize the ForesightManager with custom global settings in an Angular app (optional step)
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

import InitializeTheManager from "../\_partials/\_initialize-the-manager.mdx"

# Initialize the Manager

:::info Optional Step
This step is **not needed** if you don't want to configure ForesightJS. The manager will initialize automatically with default settings the first time a directive, component, or service registration runs.

If you don't want to configure anything, skip to [Quick Start](./quick-start.md).
:::

If you want to customize ForesightJS's global behavior, call `ForesightManager.initialize()` once at your application's entry point before Angular renders components that register elements:

```ts
import { ForesightManager } from "@foresightjs/angular"

ForesightManager.initialize({
  defaultHitSlop: 20,
  touchDeviceStrategy: "viewport",
})
```

## Optional Settings

You can configure any of these [global settings](./configuration/global-settings.md).

<InitializeTheManager />

The manager also provides several static methods you can use to inspect registered elements, callback counts, and [event](./events.md) listeners. You can find a list of these methods [here](./static-properties.md).
