---
sidebar_position: 1
---

# Introduction

ForesightJS is a lightweight JavaScript library that predicts user intent based on mouse movements. By analyzing cursor trajectory in real-time, it anticipates which elements a user is likely to interact with, allowing developers to trigger actions before the actual hover or click occurs (for example prefetching).

## How to download

```bash
npm install js.foresight
```

```bash
yarn add js.foresight
```

```bash
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
const unregister = ForesightManager.instance.register(
  myButton, // The element to track.
  () => {preloadData()} // Callback when user is predicted to interact with the element,
  20 // Optional: "hit slop" in pixels. Overwrites defaultHitSlop
)

// Later, when done with this element:
unregister()
```

## Real-World Benefits

- **Better Than Viewport Prefetching**: Only loads resources for elements the user is likely to interact with
- **Better Than Hover Prefetching**: Starts loading resources 80-150ms earlier than hover events
- **Improved Perceived Performance**: Interactions feel instant instead of slightly delayed
- **Reduced Server Load**: Minimizes unnecessary API calls and data fetching

In the following sections, you'll learn how to configure ForesightJS, debug interactions, and integrate it with popular frameworks.
