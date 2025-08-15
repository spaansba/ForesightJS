---
sidebar_position: 1
keywords:
  - ForesightJS
  - configuration
  - global settings
  - ForesightManager
  - initialization
description: Configure global ForesightJS settings that apply to the entire ForesightManager instance
last_updated:
  date: 2025-08-13
  author: Bart Spaans
---

# Global Settings

Global settings are specified when initializing the `ForesightManager` and apply to all registered elements. This should be done once at your application's entry point.

:::tip
If you want the default global options you don't need to initialize the ForesightManager explicitly.
:::

## Basic Configuration

```javascript
import { ForesightManager } from "js.foresight"

// Initialize the manager once at the top of your app if you want custom global settings
// ALL SETTINGS ARE OPTIONAL
ForesightManager.initialize({
  enableMousePrediction: true,
  positionHistorySize: 8,
  trajectoryPredictionTime: 80,
  defaultHitSlop: 10,
  enableTabPrediction: true,
  tabOffset: 3,
  enableScrollPrediction: true,
  scrollMargin: 150,
  touchDeviceStrategy: "viewport",
  enableManagerLogging: false,
  limitedConnectionType: "2g",
})
```

## Available Settings

**TypeScript Type:** `ForesightManagerSettings`

:::note
All numeric settings are clamped to their specified Min/Max values to prevent invalid configurations.
:::

### Mouse Prediction Settings

#### `enableMousePrediction`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Toggles whether trajectory prediction is active. If `false`, only direct hovers will trigger the callback for mouse users.
- **Note:** When this is turned off `ForesightJS` will still trigger `callbacks` while hovering over the element's extended range (`rect` + `hitslop`)

```javascript
ForesightManager.initialize({
  enableMousePrediction: false, // Disable trajectory prediction
})
```

---

#### `positionHistorySize`

- **Type:** `number`
- **Default:** `8`
- **Clamped between:** `2-30`
- **Description:** Number of mouse positions to keep in history for velocity calculations. Higher values provide smoother predictions but use more memory.

```javascript
ForesightManager.initialize({
  positionHistorySize: 12, // Keep more position history for smoother predictions
})
```

---

#### `trajectoryPredictionTime`

- **Type:** `number`
- **Default:** `120`
- **Clamped between:** `10-200` milliseconds
- **Description:** How far ahead (in milliseconds) to predict the mouse trajectory. Larger values trigger callbacks sooner but may reduce accuracy.

```javascript
ForesightManager.initialize({
  trajectoryPredictionTime: 100, // Predict 100ms into the future
})
```

---

### Keyboard Prediction Settings

#### `enableTabPrediction`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Toggles whether keyboard prediction is active for tab navigation.

```javascript
ForesightManager.initialize({
  enableTabPrediction: false, // Disable keyboard prediction
})
```

---

#### `tabOffset`

- **Type:** `number`
- **Default:** `2`
- **Clamped between:** `0-20`
- **Description:** Number of tab stops away from an element to trigger its callback. Only works when `enableTabPrediction` is `true`.

```javascript
ForesightManager.initialize({
  tabOffset: 1, // Trigger callback when 1 tab stop away
})
```

---

### Scroll Prediction Settings

#### `enableScrollPrediction`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Toggles whether scroll prediction is active.

```javascript
ForesightManager.initialize({
  enableScrollPrediction: false, // Disable scroll prediction
})
```

---

#### `scrollMargin`

- **Type:** `number`
- **Default:** `150`
- **Clamped between:** `30-300` pixels
- **Description:** Sets the pixel distance to check from the mouse position in the scroll direction for triggering callbacks.

```javascript
ForesightManager.initialize({
  scrollMargin: 200, // Check 200px ahead in scroll direction
})
```

---

### Hit Slop Settings

#### `defaultHitSlop`

- **Type:** `number | Rect`
- **Default:** `{top: 0, left: 0, right: 0, bottom: 0}`
- **Clamped between:** `0-2000` pixels (per side)
- **Description:** Default fully invisible "slop" around elements for all registered elements. Basically increases the hover hitbox.
- **Note:** This can be overwritten on an element basis by setting its `hitslop`.

```javascript
// Uniform hit slop
ForesightManager.initialize({
  defaultHitSlop: 20, // 20px on all sides
})

// Custom hit slop for each side
ForesightManager.initialize({
  defaultHitSlop: {
    top: 10,
    left: 20,
    right: 20,
    bottom: 15,
  },
})
```

---

### Touch Device Settings (v3.3.0+)

#### `touchDeviceStrategy`

- **Type:** `TouchDeviceStrategy`
- **Default:** `"onTouchStart"`
- **Options:** `"none"`, `"viewport"`, `"onTouchStart"`
- **Description:** Strategy to use for touch devices (mobile / pen users).

```javascript
ForesightManager.initialize({
  touchDeviceStrategy: "viewport",
})
```

---

### Limited Connection Settings (v3.3.0+)

#### `limitedConnectionType`

- **Type:** `LimitedConnectionType`
- **Default:** `"2g"`
- **Options:** `"slow-2g"`, `"2g"`, `"3g"`, `"4g"`
- **Description:** The minimum connection speed required to register elements.

```javascript
ForesightManager.initialize({
  limitedConnectionType: "2g",
})
```

---

### Other Settings

#### `enableManagerLogging`

- **Type:** `boolean`
- **Default:** `"false"`
- **Description:** Logs basic information about the `ForesightManager` and its handlers that is not available through [events](/docs/events). Mostly used by the maintainers of `ForesightJS` to debug the manager, but might be useful for implementers aswell.
- **Note:** Examples of logs are: Initializing the manager, switching from device strategy (e.g. Mouse to pen), aborting controllers and invalidating cache.

```javascript
ForesightManager.initialize({
  enableManagerLogging: true,
})
```

## Runtime Configuration Changes

You can update global settings at runtime using `alterGlobalSettings()`. This is not adviced for regular use and is mainly used for developers creating tools on top of `Foresight`. For regular use, you should set global settings during initialization with `ForesightManager.initialize()`.

```javascript
// Change settings after initialization
ForesightManager.instance.alterGlobalSettings({
  trajectoryPredictionTime: 100,
  enableScrollPrediction: false,
})
```

This is particularly useful when integrating with development tools or when you need to adjust settings based on user preferences or device capabilities.

## Development Tools Integration

:::note Development Tools
Visual development tools are available as a separate package. See the [development tools documentation](/docs/debugging/devtools) for details on installing and configuring the `js.foresight-devtools` package.
:::

The development tools provide a real-time interface for adjusting these global settings and seeing their immediate effects on prediction behavior.
