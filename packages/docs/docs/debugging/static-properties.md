---
sidebar_position: 2
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
slug: static-properties
---

# Static Properties

The ForesightManager exposes several static properties for accessing and checking the manager state.

**_All properties are read-only_**

## ForesightManager.instance

Gets the singleton instance of ForesightManager, initializing it if necessary. This is the primary way to access the manager throughout your application.

**Returns:** `ForesightManager`

**Example:**

```javascript
const manager = ForesightManager.instance

// Register a single element
manager.register({
  element: myButton,
  callback: () => console.log("Predicted interaction!"),
})

// Register multiple elements via NodeList
const navLinks = document.querySelectorAll("nav a")
manager.register({
  element: navLinks,
  callback: elementData => console.log(`Predicted: ${elementData.name}`),
})
```

## ForesightManager.instance.registeredElements

Gets a Map of all currently registered elements and their associated data. This is useful for debugging or inspecting the current state of registered elements.

**Returns:** `ReadonlyMap<ForesightElement, ForesightElementData>`

## ForesightManager.instance.isInitiated

Checks whether the ForesightManager has been initialized.

**Returns:** `Readonly<boolean>`

## ForesightManager.instance.reactivate(element)

Manually reactivates an element (or all elements in a `NodeList`), allowing its callback to be triggered again. This is useful when you want to re-enable prefetching for an element before its `reactivateAfter` timeout expires.

**Parameters:**

- `element` - The DOM element or `NodeList` to reactivate

**Example:**

```javascript
// Single element
const myButton = document.getElementById("my-button")
ForesightManager.instance.reactivate(myButton)

// Multiple elements
const navLinks = document.querySelectorAll("nav a")
ForesightManager.instance.reactivate(navLinks)
```

## ForesightManager.instance.unregister(element, reason?)

Removes an element (or all elements in a `NodeList`) from ForesightManager's tracking.

:::tip You probably don't need this
ForesightJS automatically tracks and unregisters elements when they are removed from the DOM. Manual unregistering is rarely needed and should only be used for edge cases where you want to stop tracking an element that remains in the DOM.
:::

**Parameters:**

- `element` - The DOM element or `NodeList` to unregister
- `reason` (optional) - A string describing why the element was unregistered (useful for debugging via events)

**Example:**

```javascript
// Single element
const myButton = document.getElementById("my-button")
ForesightManager.instance.unregister(myButton, "user-navigation")

// Multiple elements
const navLinks = document.querySelectorAll("nav a")
ForesightManager.instance.unregister(navLinks)
```

## ForesightManager.instance.getManagerData {#foresightmanagerinstancegetmanagerdata}

Snapshot of the current `ForesightManager` state, including all [global settings](/docs/configuration/global-settings), registered elements, position observer data, and interaction statistics. This is primarily used for debugging, monitoring, and development purposes.

**Properties:**

- `registeredElements` - `Map` of all currently registered elements and their associated data
- `eventListeners` - `Map` of all event listeners listening to [ForesightManager Events](/docs/events).
- `globalSettings` - Current [global configuration](/docs/configuration/global-settings) settings
- `globalCallbackHits` - Total `callback` execution counts by interaction type (mouse/tab/scroll/viewport/touch) and by subtype (hover/trajctory for mouse, forwards/reverse for tab, direction for scroll)
- `currentDeviceStrategy` - Which strategy is being used. Can be either `touch` or `mouse`, this changes dynamically
- `activeElementCount` - Amount of elements currently active (not the same as registered)
- `loadedModules` - Shows which handlers and predictors have been [lazy loaded](/docs/Behind_the_Scenes#bundle-optimization)

**Returns:** `Readonly<ForesightManagerData>`

The return will look something like this:

```json
{
  "registeredElements": {
    "size": 7,
    "entries": "<all your currently registered elements>"
  },
  "activeElementCount": 5,
  "currentDeviceStrategy": "mouse",
  "eventListeners": {
    "0": {
      "elementRegistered": []
    },
    "1": {
      "elementUnregistered": []
    },
    "2": {
      "elementDataUpdated": []
    },
    "3": {
      "mouseTrajectoryUpdate": []
    },
    "4": {
      "scrollTrajectoryUpdate": []
    },
    "5": {
      "managerSettingsChanged": []
    },
    "6": {
      "callbackInvoked": []
    },
    "7": {
      "callbackCompleted": []
    }
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
    "positionHistorySize": 10,
    "scrollMargin": 150,
    "tabOffset": 2,
    "trajectoryPredictionTime": 100
  },
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
    "touch": 0,
    "viewport": 0,
    "total": 8
  },
  "loadedModules": {
    "desktopHandler": true,
    "touchHandler": false,
    "predictors": {
      "mouse": true,
      "tab": true,
      "scroll": true,
      "viewport": false,
      "touchStart": false
    }
  }
}
```
