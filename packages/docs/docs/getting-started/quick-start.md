---
sidebar_position: 3
keywords:
  - ForesightJS
  - first element
  - basic usage
  - tutorial
  - getting started
description: Learn how to register your first element with ForesightJS and start predicting user intent
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

# Quick Start

This guide will walk you through registering your first element with `ForesightJS` and understanding how the prediction system works.

## Basic Usage Example

This basic example is in vanilla JS, ofcourse most people will use ForesightJS with a framework. You can read about framework integrations below.

```javascript
import { ForesightManager } from "js.foresight"

const myButton = document.querySelector("#my-button")

ForesightManager.instance.register({
  element: myButton,
  callback: () => console.log("prefetch logic here"),
})
```

Thats it!

:::note Remember to unregister
If you permanently remove a registered element from the DOM, call `ForesightManager.instance.unregister(element)` to stop tracking it. Detaching an element does not unregister it. It is parked (kept registered but inactive) and resumes if it reattaches, so an element you discard without unregistering stays parked and cannot be garbage collected. The official React and Vue integrations do this for you on unmount.
:::

## Provide registration options

However if you want to add a bit more power to your element you can give it the following props:

```javascript
import { ForesightManager } from "js.foresight"

const myButton = document.querySelector("#my-button")

ForesightManager.instance.register({
  element: myButton,
  callback: () => console.log("prefetch logic here"),
  hitSlop: 50, // slop around the element, making its hitbox bigger
  name: "My Foresight button!", // name visible in the debug tools
  meta: {
    route: "/about",
  }, // your custom meta data for analytics
  reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
})
```

## Using a framework?

ForesightJS is framework agnostic, but official [React](../react/installation.md) and [Vue](../vue/installation.md) packages exist that handle registration for you. Switch framework with the dropdown at the top of the sidebar to read those docs. Using something else? See [Other Frameworks](../other-frameworks.md) for how to build your own binding.

## Development Tools

ForesightJS has dedicated [Development Tools](../debugging/devtools.md) that help you understand and tune how prediction is working in your application:

```bash
pnpm add js.foresight-devtools
# or
npm install js.foresight-devtools
# or
yarn add js.foresight-devtools
```

```javascript
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize development tools
ForesightDevtools.initialize({
  // optional props
})
```
