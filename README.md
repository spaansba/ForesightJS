# ForesightJS

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dm/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ForesightJS is a lightweight JavaScript library that predicts user intent based on mouse movements. By analyzing cursor trajectory in real-time, it anticipates which elements a user is likely to interact with, allowing developers to trigger actions before the actual hover or click occurs (for example prefetching).

[ForesightJS docs](https://foresightjs.com/)

## Download

```bash
npm install js.foresight
# or
yarn add js.foresight
# or
pnpm add js.foresight
```

## Why Use ForesightJS?

### Problem 1: On-Hover Prefetching is Too Late

Traditional hover-based interactions have built-in delays:

- Prefetching only starts after the user hovers over an element
- The 200-300ms between intent (moving toward a button) and hover is wasted

### Problem 2: Viewport-Based Prefetching is Wasteful

Many modern frameworks (like Next.js) automatically prefetch resources for all links that enter the viewport:

- Simply scrolling up and down the Next.js homepage can trigger **1.59MB** of unnecessary prefetch requests
- Every visible link initiates prefetching, regardless of user intent

### The ForesightJS Solution

ForesightJS solves both problems by:

- **Predicting interactions before they happen** based on mouse trajectory analysis
- **Triggering actions only for elements the user is likely to interact with**
- **Starting prefetching 80-150ms earlier** than hover-based solutions
- **Reducing unnecessary requests** compared to viewport-based solutions

## Core Features

- **Mouse Trajectory Prediction**: Calculates where a user's cursor is heading
- **Expandable Hit Areas**: Custom "hit slop" areas around elements to detect intent earlier
- **Framework Agnostic**: Works with any front-end framework
- **Debug Visualization**: Built-in visual debugger for development

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

An example of what to do with touch devices can be found in the [Next.JS](https://foresightjs.com/docs/integrations/nextjs) or [React Router](https://foresightjs.com/docs/integrations/react) ForesightLink components.

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. While I haven't yet built integrations for every framework, ready-to-use implementations for [React Router](https://foresightjs.com/docs/integrations/react) and [Next.js](https://foresightjs.com/docs/integrations/nextjs) are already available. Sharing integrations for other frameworks/packages is highly appreciated!

## Configuration

ForesightJS can be used bare-bones but also can be configured. For all configuration possibilities you can reference the [docs](https://foresightjs.com/docs/config).

## Debugging visualization

ForesightJS includes a [Visual Debugging](https://foresightjs.com/docs/debugging) system that helps you understand and tune how foresight is working in your application. This is particularly helpful when setting up ForesightJS for the first time or when fine-tuning for specific UI components.
