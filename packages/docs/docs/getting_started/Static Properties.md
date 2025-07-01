---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Static Properties
  - mouse prediction
  - tab prediction
description: Static properties exposed by the Foresight Manager
last_updated:
  date: 2025-06-30
  author: Bart Spaans
slug: Static_Properties
---

# Static Properties

The ForesightManager exposes several static properties for accessing and checking the manager state.

**_All properties are read-only_**

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

## ForesightManager.instance.registeredElements

Gets a Map of all currently registered elements and their associated data. This is useful for debugging or inspecting the current state of registered elements.

**Returns:** `ReadonlyMap<ForesightElement, ForesightElementData>`

## ForesightManager.instance.isInitiated

Checks whether the ForesightManager has been initialized. Useful for conditional logic or debugging.

**Returns:** `Readonly<boolean>`

## ForesightManager.instance.getManagerData

Snapshot of the current ForesightManager state, including all [global settings](/docs/getting_started/config#global-configuration), registered elements, position observer data, and interaction statistics. This is primarily used for debugging, monitoring, and development purposes.

**Properties:**

- `registeredElements` - Map of all currently registered elements and their associated data
- `globalSettings` - Current [global configuration](/docs/getting_started/config#global-configuration) settings
- `globalCallbackHits` - Total callback execution counts by interaction type (mouse/tab/scroll) and by subtype (hover/trajctory for mouse, forwards/reverse for tab, direction for scroll)
- `positionObserverElements` - Elements currently being tracked by the position observer (a.k.a elements that are currently visible)

**Returns:** `Readonly<ForesightManagerData>`

The return will look something like this:

```json
{
  "registeredElements": {
    "size": 7,
    "entries": "<all your currently registered elements>"
  },
  "globalSettings": {
    "defaultHitSlop": {
      "bottom": 10,
      "left": 10,
      "right": 10,
      "top": 10
    },
    "enableMousePrediction": true,
    "enableScrollPrediction": true,
    "enableTabPrediction": true,
    "onAnyCallbackFired": "function",
    "positionHistorySize": 10,
    "resizeScrollThrottleDelay": 0,
    "scrollMargin": 150,
    "tabOffset": 2,
    "trajectoryPredictionTime": 100
  },
  // The total count of callbacks + which type/subtype of callback
  "globalCallbackHits": {
    "mouse": {
      "hover": 0,
      "trajectory": 3
    },
    "scroll": {
      "down": 2,
      "left": 0,
      "right": 0,
      "up": 0
    },
    "tab": {
      "forwards": 3,
      "reverse": 0
    },
    "total": 8
  }
}
```
