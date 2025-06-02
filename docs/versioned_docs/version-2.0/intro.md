---
sidebar_position: 1
---

# Introduction

ForesightJS is a lightweight JavaScript library that predicts user intent based on mouse movements and keyboard navigation. By analyzing cursor trajectory and tab sequences, it anticipates which elements a user is likely to interact with, allowing developers to trigger actions before the actual hover or click occurs (for example prefetching).

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dm/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Download

```bash
npm install js.foresight
```

```bash
yarn add js.foresight
```

```bash
pnpm add js.foresight
```

## Which problems does ForesightJS solve?

### Problem 1: On-Hover Prefetching is Too Late

Traditional hover-based prefetching only starts after the user hovers over an element. This wastes the 100-200ms between user intent (moving toward a button) and the actual hover event.

### Problem 2: Viewport-Based Prefetching is Wasteful

Many modern frameworks (like Next.js) automatically prefetch resources for all links that enter the viewport. This means every visible link is getting prefetched even though the user is most likely not going to interact with it. Simply scrolling up and down the Next.js homepage can trigger **1.59MB** of unnecessary prefetch requests.

### Problem 3: Routers don't take keyboard users into consideration

Many routers prefetch either based on viewport or hover and leave keyboard users prefetching on click. This means keyboard users get slower page loads since prefetching only happens after they click.

### The ForesightJS Solution

ForesightJS sits between viewport and hover prefetching. By predicting which element the user will interact with next, it can prefetch before hover without wasting resources like viewport prefetching. To make these predictions, it analyzes mouse movement to predict where the cursor is headed and tracks keyboard navigation by monitoring how many tab stops away the user is from registered elements.

## Basic Usage Example

```javascript
import { ForesightManager } from "foresightjs"

// Initialize the manager if you want custom global settings (do this once at app startup)
// If you dont want global settings, you dont have to initialize the manager
ForesightManager.initialize({
  debug: false, // Set to true to see visualization
  defaultHitSlop: { top: 30, left: 30, bottom: 80, right: 30 }, // Adds invisible margin around an element to increase its hitbox
})

// Register an element to be tracked
const myButton = document.getElementById("my-button")

const { isTouchDevice, unregister } = ForesightManager.instance.register({
  element: myButton,
  callback: () => {
    console.log("prefetching")
  }, // Callback when user is predicted to interact with the element,
  hitSlop: 20, // Optional: "hit slop" in pixels. Overwrites defaultHitSlop
})

// Later, when done with this element:
unregister()
```

## What about touch devices?

ForesightJS focuses on using mouse movement for prefetching, so you'll need your own approach for touch devices like phones and tablets. The `ForesightManager.instance.register()` method returns an `isTouchDevice` boolean that you can use to create this separate logic. You can safely call `register()` even on touch devices, as the Foresight manager will bounce touch devices to avoid unnecessary processing.

An example of what to do with touch devices can be found in the [Next.JS ForesightLink component](/docs/integrations/nextjs#foresightlink-component) integrations
An example of what to do with touch devices can be found in the [Next.JS](/docs/integrations/nextjs#foresightlink-component) or [React Router](/docs/integrations/react#foresightlink-component) ForesightLink components.
