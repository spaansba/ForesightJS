---
sidebar_position: 2
---

# Configuration

ForesightJS provides two levels of configuration:

1. **Global Configuration**: Applied to the entire ForesightManager through initialization
2. **Element-Specific Configuration**: Applied when registering individual elements

## Global Configuration

Global settings are specified when initializing the ForesightManager. This should be done once at your application's entry point. If you want the default global options you dont need to initialize the ForesightManager.

```javascript
import { ForesightManager } from "foresightjs"

// Initialize the manager if you want custom global settings (do this once at app startup)
ForesightManager.initialize({
  debug: false,
  enableMousePrediction: true,
  positionHistorySize: 8,
  trajectoryPredictionTime: 80,
  defaultHitSlop: 10,
  resizeScrollThrottleDelay: 50,
})
```

### Available Global Options

| Option                      | Type           | Default                                  | Description                                                                                                      |
| --------------------------- | -------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `debug`                     | boolean        | `false`                                  | When true, enables visual debugging overlays showing hit areas, trajectories, and a control panel                |
| `enableMousePrediction`     | boolean        | `true`                                   | Toggles whether trajectory prediction is active                                                                  |
| `positionHistorySize`       | number         | `8`                                      | Number of mouse positions to keep in history for velocity calculations                                           |
| `trajectoryPredictionTime`  | number         | `80`                                     | How far ahead (in milliseconds) to predict the mouse trajectory                                                  |
| `defaultHitSlop`            | number \| Rect | `{top: 0, left: 0, right: 0, bottom: 0}` | Default fully invisible "slop" around elements for all registered elements. Basically increases the hover hitbox |
| `resizeScrollThrottleDelay` | number         | `50`                                     | Throttle delay (in ms) for recalculating element bounds during resize/scroll events                              |

## Element-Specific Configuration

When registering elements with the ForesightManager, you can provide configuration specific to each element:

```javascript
const element = document.getElementById("my-element")

const unregister = ForesightManager.instance.register(
  element, // The element to monitor
  () => {
    // Callback function
    console.log("User is about to interact with the element")
    preloadData()
  },
  { top: 20, left: 10, bottom: 100, right: 50 }, // Hit slop (also accepts a singular number for all sides)
  "Navigation Button" // Optional name (useful for debugging)
)

// its best practice to unregister the element if you are done with it (return of an useEffect in React for example)
unregister(element)
```

### Element Registration Parameters

| Parameter  | Type           | Required | Description                                                                     |
| ---------- | -------------- | -------- | ------------------------------------------------------------------------------- |
| `element`  | HTMLElement    | Yes      | The DOM element to monitor                                                      |
| `callback` | function       | Yes      | Function that executes when interaction is predicted or occurs                  |
| `hitSlop`  | number \| Rect | No       | Fully invisible "slop" around the element. Basically increases the hover hitbox |
| `name`     | string         | No       | A descriptive name, useful in debug mode                                        |
