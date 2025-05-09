---
sidebar_position: 2
---

# Configuration

ForesightJS provides two levels of configuration:

1. **Global Configuration**: Applied to the entire ForesightManager through initialization
2. **Element-Specific Configuration**: Applied when registering individual elements

## Global Configuration

Global settings are specified when initializing the ForesightManager. This should be done once at your application's entry point:

```javascript
import { ForesightManager } from "foresightjs"

// Initialize the manager if you want custom global settings (do this once at app startup)
// If you dont want global settings, you dont have to initialize the manager
ForesightManager.initialize({
  // Configuration options here
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
```

### Element Registration Parameters

| Parameter  | Type           | Required | Description                                                                     |
| ---------- | -------------- | -------- | ------------------------------------------------------------------------------- |
| `element`  | HTMLElement    | Yes      | The DOM element to monitor                                                      |
| `callback` | function       | Yes      | Function that executes when interaction is predicted or occurs                  |
| `hitSlop`  | number \| Rect | No       | Fully invisible "slop" around the element. Basically increases the hover hitbox |
| `name`     | string         | No       | A descriptive name, useful in debug mode                                        |

### Hit Slop Explained

The `hitSlop` parameter defines how much to expand the element's bounding box for detection purposes. It can be:

- A single number (applied equally to all sides)
- A `Rect` object for granular control:

```javascript
// Uniform 20px hit slop on all sides
manager.register(element, callback, 20)

// Custom hit slop with different values per side
manager.register(element, callback, {
  top: 30, // 30px above the element
  right: 100, // 100px to the right
  bottom: 10, // 10px below
  left: 50, // 50px to the left
})
```

This is especially useful for:

- Small targets that need larger hit areas
- Elements where approaching from one direction is more common
- Creating "lanes" for nested interactive elements

## Configuration Best Practices

1. **Adjust `trajectoryPredictionTime` based on your use case**:

   - Smaller values (40-60ms) for subtle, quick optimizations
   - Larger values (80-150ms) for pre-loading resource-intensive content

2. **Be conservative with `positionHistorySize`**:

   - Smaller values (4-6) for more responsive but potentially jittery predictions
   - Larger values (8-12) for smoother but slightly delayed predictions

3. **Use custom `hitSlop` values aligned with UI design**:

   - Consider the approach angles and design of your UI
   - Use larger hit areas for important or commonly used elements

4. **Set meaningful debug names for complex UIs**:

   - When debugging, the element name helps identify which element is being interacted with

5. **Consider performance with many elements**:
   - Register/unregister elements as they enter/exit the viewport
   - Increase `resizeScrollThrottleDelay` for performance if you have many elements
