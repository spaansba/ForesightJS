---
keywords:
  - ForesightJS
  - initialize
  - ForesightManager
  - configuration
  - setup
  - Astro
description: Configure the ForesightManager with custom global settings through the Astro integration (optional step)
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import InitializeTheManager from "../\_partials/\_initialize-the-manager.mdx"

# Initialize the Manager

:::info Optional Step
This step is **not needed** if you don't want to configure ForesightJS. The integration initializes the manager automatically with default settings on page load.

If you don't want to configure anything, skip to [Quick Start](./quick-start.md).
:::

In Astro you don't call `ForesightManager.initialize()` yourself. The integration does it in the script it injects into every page. To customize global behavior, pass the same settings object through the `manager` option:

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
import foresight from "@foresightjs/astro"

export default defineConfig({
  integrations: [
    foresight({
      manager: {
        defaultHitSlop: 20,
        touchDeviceStrategy: "viewport",
      },
    }),
  ],
})
```

## Optional Settings

`manager` accepts any of these [global settings](./configuration/global-settings.md).

<InitializeTheManager />

The manager also provides several static methods you can use to inspect registered elements, callback counts, and [event](./events.md) listeners. You can find a list of these methods [here](./static-properties.md).
