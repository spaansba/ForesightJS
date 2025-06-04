---
sidebar_position: 4
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
  author: spaansba
---

# Debugging

ForesightJS includes a debugger that helps you understand and tune how ForesightJS is working in your application. This is particularly helpful when setting up ForesightJS for the first time and understand what each configurable parameter does exactly.

## Enabling Debug Mode

The debugger is turned on in the initialization of ForesightManager (see [configuration](/docs/next/config))

```javascript
import { ForesightManager } from "foresightjs"

ForesightManager.initialize({
  debug: true, // Enable debug mode
  debuggerSettings: {
    isControlPanelDefaultMinimized: false, // optional debug setting which allows you to minimize the control panel on default
  },
})
```

## Debug Mode Features

When debug mode is enabled, ForesightJS adds several visual elements to your application in an shadow-dom:

### Visual Debug Elements

1. **(Expanded) Area Overlays**: Dashed borders showing the expanded hit areas (hit slop)

2. **Trajectory Visualization**: The predicted mouse path is shown with an orange line, with an orange circle showing the predicted future mouse position after `trajectoryPredictionTime` milliseconds.

3. **Element Names**: Labels above each registered element (if you provided names during registration)

### Control Panel

A control panel appears in the bottom-right corner of the screen, allowing you to change all available [Global Configurations](/docs/next/config#global-configuration). These controls affect the `ForesightManager` configuration in real-time, allowing you to see how different settings impact its behavior. They are however only applicable to your current session, to save these values change them in your initialization.

#### View currently registered elements

The control panel also shows an overview of the currently registered elements. Here the `name` attribute on the element is used to display the hover/trajectory state of the element. This section also displays the element's `unregisterOnCallback` value (Single for `true` and Multi for `false`)

:::tip
Happy with the adjusted settings in the Control Panel? Click the copy button on the top right to easely paste the new settings into your project.
:::
