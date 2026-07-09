---
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - "@foresightjs/astro"
  - configuration
  - global settings
  - ForesightManager
description: Configure global ForesightJS settings in an Astro app
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import GlobalSettings from "../../\_partials/\_global-settings.mdx"

# Global Settings

Global settings apply to all registered elements. In Astro you pass them through the [`manager`](../integration.md#manager) option of the integration instead of calling `ForesightManager.initialize()` yourself:

```js
// astro.config.mjs
foresight({
  manager: {
    trajectoryPredictionTime: 100,
    defaultHitSlop: 20,
  },
})
```

The `manager` object accepts everything `ForesightManager.initialize()` does:

<GlobalSettings />
