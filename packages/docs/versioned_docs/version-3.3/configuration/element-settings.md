---
sidebar_position: 2
keywords:
  - ForesightJS
  - element configuration
  - element settings
  - registration options
  - hitSlop
  - element metadata
description: Configure individual element settings when registering with ForesightManager
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# Element Settings

When registering elements with the `ForesightManager`, you can provide configuration specific to each element. This allows you to fine-tune prediction behavior on a per-element basis.

## Basic Element Registration

```javascript
const myElement = document.getElementById("my-element")

const { isTouchDevice, isLimitedConnection, isRegistered } = ForesightManager.instance.register({
  element: myElement, // Required: The element to monitor
  callback: () => {
    // Required: Function that executes when interaction is predicted
    console.log("prefetching")
  },
  hitSlop: 50, // slop around the element, making its hitbox bigger
  name: "My Foresight button!", // name visible in the debug tools
  meta: {
    route: "/about",
  }, // your custom meta data for analytics
  reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
})
```

## Registration Parameters

**TypeScript Type:** `ForesightRegisterOptions` or `ForesightRegisterOptionsWithoutElement` if you want to omit the `element`

### Required Parameters

#### `element`

- **Type:** `element`
- **Required:** Yes
- **Description:** The DOM element to monitor for user interactions.

```javascript
const button = document.querySelector("#my-button")

ForesightManager.instance.register({
  element: button, // Any DOM element
  callback: () => {
    /* prefetch logic */
  },
})
```

---

#### `callback`

- **Type:** `function`
- **Required:** Yes
- **Description:** Function that executes when interaction is predicted or occurs. This is where your prefetching logic goes.
- **Note:** If you await your prefetch logic the `callbackCompleted` [event](/docs/events#callbackcompleted) will show you how long your prefetch took to run.

```javascript
ForesightManager.instance.register({
  element: myElement,
  callback: () => {
    // prefetch logic
  },
})
```

---

### Optional Parameters

#### `hitSlop`

- **Type:** `number | Rect`
- **Required:** No
- **Default:** Uses `defaultHitSlop` from global settings (which is 0 if not set)
- **Description:** Fully invisible "slop" around the element that increases the hover hitbox.

```javascript
// Uniform hit slop (20px on all sides)
ForesightManager.instance.register({
  element: myElement,
  callback: () => {},
  hitSlop: 20,
})

// Custom hit slop for each side
ForesightManager.instance.register({
  element: myElement,
  callback: () => {},
  hitSlop: {
    top: 10,
    left: 50,
    right: 50,
    bottom: 100,
  },
})
```

---

#### `name`

- **Type:** `string`
- **Required:** No
- **Default:** `element.id` or `"unnamed"` if no id
- **Description:** A descriptive name for the element, useful for development tools and debugging.

```javascript
ForesightManager.instance.register({
  element: myElement,
  callback: () => {
    /* logic */
  },
  name: "Product Navigation Button", // Helpful for debugging
})
```

---

#### `reactivateAfter`

- **Type:** `number`
- **Required:** No
- **Default:** `Infinity`
- **Description:** Time in milliseconds after which the callback can be fired again. Set to `Infinity` to prevent callback from firing again after first execution.
- **Note:** Even though `ForesightJS` doesn't store any data, you can set this to the same time as your data would become `stale` normally. In most cases you can just leave this on the default value, as it will get reset on page refresh/rerouting anyways.

```javascript
ForesightManager.instance.register({
  element: myElement,
  callback: () => {},
  reactivateAfter: 5 * 60 * 1000, // 5 minutes
})
```

---

#### `meta`

- **Type:** `Record<string, unknown>`
- **Required:** No
- **Default:** `{}`
- **Description:** Stores additional information about the registered element. Visible in all element-related [events](/docs/events) and in the [devtools](/docs/debugging/devtools).

```javascript
ForesightManager.instance.register({
  element: productLink,
  callback: () => {},
  meta: {
    route: "/about",
    section: "main",
    category: "content",
  },
})
```

## Registration Return Value

The `register()` method returns useful information about the registration:

**TypeScript Type:** `ForesightRegisterResult`

```javascript
const { isTouchDevice, isLimitedConnection, isRegistered } = ForesightManager.instance.register({
  element: myElement,
  callback: () => {},
})
```

---

### Return Properties

#### `isTouchDevice`

- **Type:** `boolean`
- **Description:** Indicates whether the current device is a touch device.

---

#### `isLimitedConnection`

- **Type:** `boolean`
- **Description:** Is `true` when the user is on a 2G connection or has data-saver enabled. Elements will not be registered when connection is limited.

---

#### `isRegistered`

- **Type:** `boolean`
- **Description:** If `isLimitedConnection` is `true`, this will be `false`. Otherwise indicates successful registration.
