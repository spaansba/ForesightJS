---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - ForesightDevtools
  - Debug Controller
  - js.foresight-debugger
  - mouse prediction
  - tab prediction
  - Debugger
  - mobile prefetching
  - desktop prefetching
description: Documentation on how to use the ForesightJS debugger
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# Development Tools

[![npm version](https://img.shields.io/npm/v/js.foresight-devtools.svg)](https://www.npmjs.com/package/js.foresight-devtools)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`ForesightJS` offers dedicated [Development Tools](https://github.com/spaansba/ForesightJS/tree/main/packages/js.foresight-devtools), written in [Lit](https://lit.dev/), to help you better understand and fine-tune how `ForesightJS` works within your application. You can see the development tools in action on the [playground page](https://foresightjs.com/#playground), which includes visual trajectory indicators, element boundaries, and a control panel in the bottom-right corner.

These tools are built entirely using `ForesightJS`'s [built-in events](/docs/events), demonstrating how you can create your own monitoring and debugging tools using the same event system.

## Installation

To install the `ForesightJS` Development Tools package, use your preferred package manager:

```bash
pnpm add -D js.foresight-devtools
# or
npm install -D js.foresight-devtools
# or
yarn add -D js.foresight-devtools
```

## Enabling Development Tools

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
    callbackCompleted: true,
    elementReactivated: true,
    callbackInvoked: true,
    elementDataUpdated: false,
    elementRegistered: false,
    elementUnregistered: false,
    managerSettingsChanged: true,
    mouseTrajectoryUpdate: false, // dont log this to the devtools
    scrollTrajectoryUpdate: false, // dont log this to the devtools
    deviceStrategyChanged: true,
  },
})
```

## Development Tools Features

Once enabled, the `ForesightJS` Development Tools add several visual layers to your application, including mouse and scroll trajectories and element hitboxes. A control panel also appears in the bottom-right corner of the screen.

### Control Panel

The control panel provides three main tabs for debugging and configuration. Each tab serves a specific purpose in understanding and tuning ForesightJS behavior.

#### Settings Tab

The Settings tab provides real-time controls for all [Global Configurations](/docs/configuration/global-settings). Changes made through these controls immediately affect the `ForesightManager` configuration, allowing you to see how different settings impact your app without fiddling in your code.

#### Elements Tab

The Elements tab displays a overview of all currently registered elements within the `ForesightManage`r. Each element entry shows its current status through color-coded indicators:

- 🟢 **Green** - Active visible elements in desktop mode
- ⚫ **Grey** - Active invisible elements in desktop mode
- 🟣 **Purple** - Active elements while in touch device mode (all elements, we dont track visibility in this mode)
- 🟡 **Yellow** - Elements which callbacks are currently executing
- 🔘 **Light Gray** - Inactive elements

Each element can also be expanded to reveal its [`ForesightElementData`](/docs/next/getting-started/typescript#foresightelementdata) information including settings, callback status, and metadata. A countdown timer appears for elements in their reactivation cooldown period (`reactivateAfter`), clicking this timer will instantly reactivate the element.

#### Log Tab

The Log tab displays real-time [events](/docs/events) emitted by `ForesightJS`. You can see callback execution times, the full element's lifecycle and other system events. Events can be filtered through the devtools initialization configuration or in the control panel itself.

You can also print out the complete [`ForesightManager.instance.getManagerData`](/docs/debugging/static-properties#foresightmanagerinstancegetmanagerdata) state without having to call it from your code.

:::caution
Avoid logging frequently emitted events to the browser console, as it can noticeably slow down your development environment. Use the control panel for this instead.
:::

:::note
Element overlay visualization and visibility sorting in the control panel only work with desktop/mouse prediction strategies. When debugging `touchDeviceStrategy` configurations, these features are not available as touch strategies don't track the same positioning data.
:::
