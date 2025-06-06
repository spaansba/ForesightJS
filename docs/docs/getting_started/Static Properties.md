---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - Static Properties
  - mouse prediction
  - tab prediction
description: Static properties exposed by the Foresight Manager
last_updated:
  date: 2025-06-06
  author: spaansba
slug: Static_Properties
---

# Static Properties

The ForesightManager exposes several static properties for accessing and checking the manager state.

## `ForesightManager.instance`

Gets the singleton instance of ForesightManager, initializing it if necessary. This is the primary way to access the manager throughout your application.

**Returns:** `ForesightManager`

**Example:**

```javascript
const manager = ForesightManager.instance

// Register an element
manager.register({
  element: myButton,
  callback: () => console.log("Predicted interaction!"),
})

// or
ForesightManager.instance.register({
  element: myButton,
  callback: () => console.log("Predicted interaction!"),
})
```

## ForesightManager.isInitiated

Checks whether the ForesightManager has been initialized. Useful for conditional logic or debugging.

**Returns:** `boolean`

## ForesightManager.globalSettings

Gets the current [global settings](/docs/getting_started/config#global-configuration) set by the default setting or by `ForesightManager.Initialize`

**Returns:** `ForesightManagerProps`
