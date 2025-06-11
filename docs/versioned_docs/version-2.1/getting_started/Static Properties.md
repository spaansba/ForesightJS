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

Gets a comprehensive snapshot of the current ForesightManager state, including all [global settings](/docs/getting_started/config#global-configuration), registered elements, position observer data, and interaction statistics. This is primarily used for debugging, monitoring, and development purposes.

**Returns:** `Readonly<ForesightManagerData>`

**Properties:**

- `registeredElements` - Map of all currently registered elements and their associated data
- `globalSettings` - Current [global configuration](/docs/getting_started/config#global-configuration) settings
- `globalCallbackHits` - Total callback execution counts by interaction type (mouse/tab) and by subtype (hover/trajctory for mouse, forwards/reverse for tab)
- `positionObserverElements` - Elements currently being tracked by the position observer (a.k.a elements that are currently visible)

## ForesightManager.instance.globalCallbackHits

Gets the total count of callback executions across all registered elements, broken down by interaction type (mouse / tab).

**Returns:** `Readonly<CallbackHits>`
