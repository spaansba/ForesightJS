---
sidebar_position: 2
keywords:
  - ForesightJS
  - JS.Foresight
  - ForesightDevtools
  - Debug Controller
  - js.foresight-debugger
  - mouse prediction
  - tab prediction
  - Debugger
description: Documentation on how to use the ForesightJS debugger
last_updated:
  date: 2025-06-30
  author: Bart Spaans
---

# Development Tools

[![npm version](https://img.shields.io/npm/v/js.foresight-devtools.svg)](https://www.npmjs.com/package/js.foresight-devtools)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ForesightJS offers dedicated [Development Tools](https://github.com/spaansba/ForesightJS/tree/main/packages/js.foresight-devtools), written in [Lit](https://lit.dev/), to help you better understand and fine-tune how ForesightJS works within your application. This standalone development package is helpful when setting up ForesightJS for the first time and understanding what each configurable parameter does.

These tools are built entirely using ForesightJS's [built-in events](/docs/getting_started/events), demonstrating how you can create your own monitoring and debugging tools using the same event system.

## Installation

To install the ForesightJS Development Tools package, use your preferred package manager:

```bash
pnpm add -D js.foresight-devtools
# or
npm install -D js.foresight-devtools
# or
yarn add -D js.foresight-devtools
```

## Enabling Development Tools

The development tools are a separate package that integrate with your ForesightJS setup:

```javascript
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize ForesightJS
ForesightManager.initialize({})

// Initialize the development tools (all options are optional)
ForesightDevtools.initialize({
  showDebugger: true,
  isControlPanelDefaultMinimized: false, // optional setting which allows you to minimize the control panel on default
  showNameTags: true, // optional setting which shows the name of the element
  sortElementList: "visibility", // optional setting for how the elements in the control panel are sorted
  logging: {
    logLocation: "controlPanel", // Where to log the Foresight Events
    callbackCompleted: false,
    callbackInvoked: false,
    elementDataUpdated: false,
    elementRegistered: false,
    elementUnregistered: false,
    managerSettingsChanged: false,
    mouseTrajectoryUpdate: false,
    scrollTrajectoryUpdate: false,
  },
})
```

## Development Tools Features

Once enabled, the ForesightJS Development Tools add several visual layers to your application, including mouse and scroll trajectories and element hitboxes. A control panel also appears in the bottom-right corner of the screen.

### Control Panel

This panel allows you to change all available [Global Configurations](/docs/getting_started/config#global-configuration). These controls affect the `ForesightManager` configuration in real-time, allowing you to see how different settings impact its behavior.

In addition to configuration controls, the panel provides two extra key views: one for registered elements and another for displaying emitted event logs.

#### View currently registered elements

The control panel also shows an overview of the currently registered elements. Next to each element's visibility the element will also show when its currently prefetching and when its done prefetching. If you need more detailed information about the prefetching of elements, or the inner workings of Foresight you can change to the logs tab.

#### View emitted event logs

This section displays a timeline of emitted enabled Foresight [events](/docs/getting_started/events), helping you track and understand how the system responds to user interactions and state changes in real time.

:::caution
Avoid logging frequently emitted events to the browser console, as it can noticeably slow down your development environment. Use the control panel for this instead.
:::
