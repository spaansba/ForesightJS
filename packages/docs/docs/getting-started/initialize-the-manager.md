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
  date: 2026-06-09
  author: Bart Spaans
---

import InitializeTheManager from "../\_partials/\_initialize-the-manager.mdx"

# Initialize the Manager

:::info Optional Step
This step is **not needed** if you don't want to configure ForesightJS. The manager will initialize automatically with default settings when you register your first element.

If you don't want to configure anything, skip to [Quick Start](./quick-start.md).
:::

If you want to customize ForesightJS's global behavior, you can initialize the manager with your preferred settings at your application's entry point.

## Optional Settings

You can configure any of these [global settings](../configuration/global-settings.md).

<InitializeTheManager />

The manager also provides several static methods for inspecting which elements are registered, how many callbacks have run, and the registered [event](../events.md) listeners. You can find a list of these methods [here](../debugging/static-properties.md).
