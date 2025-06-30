---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - ForesightDebugger
  - Debug Controller
  - mouse prediction
  - tab prediction
  - Debugger
description: Documentation on how to use the ForesightJS debugger
last_updated:
  date: 2025-06-30
  author: Bart Spaans
---

# Development Tools

ForesightJS has dedicated [Development Tools](https://github.com/spaansba/ForesightJS-DevTools) that help you understand and tune how ForesightJS is working in your application. This standalone development package is particularly helpful when setting up ForesightJS for the first time and understanding what each configurable parameter does.

## Installation

Install the ForesightJS Development Tools package:

```bash
pnpm add -D js.foresight-devtools
# or
npm install -D js.foresight-devtools
# or
yarn add -D js.foresight-devtools
```

## Enabling Development Tools

The development tools are a separate package that work alongside your ForesightJS implementation:

```javascript
import { ForesightManager } from "js.foresight"
import { ForesightDebugger } from "js.foresight-devtools"

// Initialize ForesightJS
ForesightManager.initialize({
  // optional props
})

// Initialize the development tools
ForesightDebugger.initialize(ForesightManager.instance, {
  showDebugger: true,
  isControlPanelDefaultMinimized: false, // optional setting which allows you to minimize the control panel on default
  showNameTags: true, // optional setting which shows the name of the element
  sortElementList: "visibility", // optional setting for how the elements in the control panel are sorted
})
```

## Development Tools Features

When the development tools are enabled, the ForesightJS Development Tools add several visual elements to your application in a shadow-dom:

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
