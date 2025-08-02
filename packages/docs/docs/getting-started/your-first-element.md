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
  date: 2025-07-31
  author: Bart Spaans
---

# Your First Element

This guide will walk you through registering your first element with ForesightJS and understanding how the prediction system works.

## Basic Usage Example

This basic example is in vanilla JavaScript. Most people will use ForesightJS with a framework - you can read about framework integrations in the integrations section below.

```javascript
import { ForesightManager } from "js.foresight"

// Register an element to be tracked
const myButton = document.getElementById("my-button")

ForesightManager.instance.register({
  element: myButton,
  callback: () => {
    // This is where your prefetching logic goes
    console.log("User is likely to interact with this element!")
  },
  // Optional element settings
})
```

Thats it!

## Provide element settings

However if you want to add a bit more power to your element you can give it the following props:

```javascript
import { ForesightManager } from "js.foresight"

const myButton = document.getElementById("my-button")

ForesightManager.instance.register({
  element: myButton,
  callback: () => {
    console.log("User is likely to interact with this element!")
  },
  hitSlop: 50, // slop around the element, making its hitbox bigger
  name: "My Foresight button!", // name visible in the debug tools
  meta: {
    route: "/about",
  }, // your custom meta data for analytics
  reactivateAfter: 5 * 60 * 1000, // time for the element to reactivate after the callback has been hit
})
```

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. Ready-to-use implementations are available for:

- [Next.js](/docs/integrations/react/nextjs)
- [React Router](/docs/integrations/react/react-router)
- [Angular](/docs/integrations/angular)

## Development Tools

ForesightJS has dedicated [Development Tools](/docs/debugging/devtools) that help you understand and tune how prediction is working in your application:

```bash
npm install js.foresight-devtools
```

```javascript
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize development tools
ForesightDevtools.initialize({
  // optional props
})
```
