---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - ForesightDebugger
  - Debug Controller
  - mouse prediction
  - tab prediction
description: Documentation on how to use the ForesightJS debugger
last_updated:
  date: 2025-06-04
  author: Bart Spaans
---

# Debugging

ForesightJS includes a debugger that helps you understand and tune how ForesightJS is working in your application. This is particularly helpful when setting up ForesightJS for the first time and understand what each configurable parameter does.

## Enabling Debug Mode

The debugger is enabled during `ForesightManager.initialize` (see [configuration](/docs/getting_started/config))

```javascript
import { ForesightManager } from "foresightjs"

ForesightManager.initialize({
  debug: true, // Enable debug mode
  debuggerSettings: {
    isControlPanelDefaultMinimized: false, // optional setting which allows you to minimize the control panel on default
    showNameTags: true, // optional setting which shows the name of the element
    sortElementList: "visibility", // optional setting for how the elements in the control panel are sorted
  },
})
```

## Debug Mode Features

When debug mode is enabled, ForesightJS adds several visual elements to your application in a shadow-dom:

### Visual Debug Elements

1. **(Expanded) Area Overlays**: Dashed borders showing the expanded hit areas (hit slop)

2. **Trajectory Visualization**: The predicted mouse path is shown with an line, with a circle showing the predicted future mouse position after `trajectoryPredictionTime` milliseconds.

3. **Element Names**: Labels above each registered element. Can be turned off by setting `showNameTags` to `false`

### Control Panel

A control panel appears in the bottom-right corner of the screen, allowing you to change all available [Global Configurations](/docs/getting_started/config#global-configuration). These controls affect the `ForesightManager` configuration in real-time, allowing you to see how different settings impact its behavior. They are however only applicable to your current session, to save these values change them in your initialization.

#### View currently registered elements

The control panel also shows an overview of the currently registered elements. Next to each element's visibility this section also displays the element's `hitSlop` and `unregisterOnCallback` value (Single for `true` and Multi for `false`).

:::tip
Happy with the adjusted settings in the Control Panel? Click the copy button on the top right to easily paste the new settings into your project.
:::
