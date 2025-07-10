---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - ForesightManager
  - configuration
  - mouse prediction
  - tab prediction
description: Configuration documenation for the ForesightJS library
last_updated:
  date: 2025-06-30
  author: Bart Spaans
---

# Configuration

ForesightJS provides two levels of configuration:

1. **Global Configuration**: Applied to the entire ForesightManager through initialization
2. **Element-Specific Configuration**: Applied when registering individual elements

## Global Configuration

Global settings are specified when initializing the ForesightManager. This should be done once at your application's entry point.

_If you want the default global options you dont need to initialize the ForesightManager._

```javascript
import { ForesightManager } from "foresightjs"

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
})
```

### Available Global Settings

**Typescript Type:** `ForesightManagerSettings`

:::note
All numeric settings are clamped to their specified Min/Max values to prevent invalid configurations.
:::

| Setting                    | Type               | Default                                  | Min/Max | Description                                                                                                                |
| -------------------------- | ------------------ | ---------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `enableMousePrediction`    | `boolean`          | `true`                                   | -       | Toggles whether trajectory prediction is active. If `false`, only direct hovers will trigger the callback for mouse users. |
| `positionHistorySize`      | `number`           | 8                                        | 0/30    | Number of mouse positions to keep in history for velocity calculations                                                     |
| `trajectoryPredictionTime` | `number`           | 120                                      | 10/200  | How far ahead (in milliseconds) to predict the mouse trajectory                                                            |
| `defaultHitSlop`           | `number` \| `Rect` | `{top: 0, left: 0, right: 0, bottom: 0}` | 0/2000  | Default fully invisible "slop" around elements for all registered elements. Basically increases the hover hitbox           |
| `enableTabPrediction`      | `boolean`          | `true`                                   | -       | Toggles whether keyboard prediction is on                                                                                  |
| `tabOffset`                | `number`           | 2                                        | 0/20    | Tab stops away from an element to trigger callback                                                                         |
| `enableScrollPrediction`   | `boolean`          | `true`                                   | -       | Toggles whether scroll prediction is on on                                                                                 |
| `scrollMargin`             | `number`           | 150                                      | 30/300  | Sets the pixel distance to check from the mouse position in the scroll direction callback                                  |

:::note Development Tools
Visual development tools are now available as a separate package. See the [development tools documentation](/docs/getting_started/development_tools) for details on installing and configuring the `js.foresight-devtools` package.
:::

## Element-Specific Configuration

When registering elements with the ForesightManager, you can provide configuration specific to each element:

```javascript
const myElement = document.getElementById("my-element")

const { unregister, isTouchDevice } = ForesightManager.instance.register({
  element: myElement, // The element to monitor
  callback: () => {
    console.log("prefetching")
  }, // Function that executes when interaction is predicted or occurs
  hitSlop: { top: 10, left: 50, right: 50, bottom: 100 }, // Fully invisible "slop" around the element. Basically increases the hover hitbox
  name: "My button name", // A descriptive name, useful for development tools
  unregisterOnCallback: false, // Should the callback be ran more than ones?
})

// its best practice to unregister the element if you are done with it (return of an useEffect in React for example)
unregister(element)
```

### Element Registration Parameters

**Typescript Type:** `ForesightRegisterOptions` or `ForesightRegisterOptionsWithoutElement` if you want to omit the `element`

| Parameter  | Type           | Required | Description                                                                     | Default                             |
| ---------- | -------------- | -------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| `element`  | HTMLElement    | Yes      | The DOM element to monitor                                                      |                                     |
| `callback` | function       | Yes      | Function that executes when interaction is predicted or occurs                  |                                     |
| `hitSlop`  | number \| Rect | No       | Fully invisible "slop" around the element. Basically increases the hover hitbox | 0 or defaultHitSlop from initialize |
| `name`     | string         | No       | A descriptive name for the element, useful for development tools.               | element.id or "" if there is no id  |

### Return Value of register()

The `ForesightManager.instance.register()` method returns an object with the following properties:

**Typescript Type:** `ForesightRegisterResult`

| Property              | Type     | Description                                                                                                                                                                                 |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isTouchDevice`       | boolean  | Indicates whether the current device is a touch device. Elements will not be registered on touch devices. [See](/docs/getting_started#what-about-touch-devices)                             |
| `isLimitedConnection` | boolean  | Is true when the user is on a 2g connection or has data-saver enabled. Elements will not be registered when connection is limited.                                                          |
| `isRegistered`        | boolean  | If either `isTouchDevice` or `isLimitedConnection` is `true` this will become `false`. Usefull for implementing alternative prefetching logic.                                              |
| `unregister`          | function | A function that can be called to remove the element from tracking when no longer needed. When `unregisterOnCallback` is true this will be done automatically ones the callback is ran ones. |
