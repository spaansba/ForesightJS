---
sidebar_position: 2
keywords:
  - ForesightJS
  - element configuration
  - registration options
  - registration options
  - hitSlop
  - element metadata
description: The options you pass when registering an element with ForesightManager
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import ElementSettings from "../\_partials/\_registration-options.mdx"

# Registration Options

When registering elements with the `ForesightManager`, you can provide configuration specific to each element. This allows you to fine-tune prediction behavior on a per-element basis.

## Basic Element Registration

```javascript
const myElement = document.getElementById("my-element")

const { unregister, isLimitedConnection, isRegistered } = ForesightManager.instance.register({
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
  enabled: true, // when false the element stays registered but inactive
})
```

<ElementSettings />
