---
sidebar_position: 2
keywords:
  - ForesightJS
  - initialize
  - ForesightManager
  - configuration
  - setup
description: Learn how to initialize the ForesightManager with custom global settings (optional step)
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# Initialize the Manager

:::info Optional Step
This step is **not needed** if you don't want to configure ForesightJS. The manager will initialize automatically with default settings when you register your first element.

If you don't want to configure anything, skip to [Your First Element](/docs/getting-started/your-first-element).
:::

If you want to customize ForesightJS's global behavior, you can initialize the manager with your preferred settings at your application's entry point.

## Optional Settings

You can configure any of these [global settings](/docs/configuration/global-settings).

```javascript
ForesightManager.initialize({
  // Mouse prediction settings
  enableMousePrediction: true, // Enable/disable mouse trajectory prediction
  trajectoryPredictionTime: 120, // How far ahead to predict (10-200ms)
  positionHistorySize: 8, // Mouse positions to track (2-30)

  // Keyboard prediction settings
  enableTabPrediction: true, // Enable/disable keyboard navigation prediction
  tabOffset: 2, // Tab stops ahead to trigger (0-20)

  // Scroll prediction settings
  enableScrollPrediction: true, // Enable/disable scroll prediction
  scrollMargin: 150, // Pixel distance for scroll detection (30-300)

  // Touch device settings
  touchDeviceStrategy: "viewport", // "none", "viewport", or "onTouchStart"

  // Connection settings
  minimumConnectionType: "3g", // "slow-2g", "2g", "3g", "4g"

  // Default element settings
  defaultHitSlop: 0, // Default hit slop for all elements (number or {top, right, bottom, left})
})
```

## Good to know

The `ForesightManager` is a singleton, meaning it can only be initialized once. If you call `ForesightManager.initialize()` multiple times, only the first call will take effect. Any subsequent calls will simply return the already initialized instance.

The manager also provides several static methods you can use to get information about which elements are registered, how many callbacks have been ran and all the listeneing [event](/docs/events) listeners. You can find a list of these methods [here](/docs/debugging/static-properties).
