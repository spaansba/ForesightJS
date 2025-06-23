---
sidebar_position: 1
keywords:
  - Introduction
  - JS.Foresight
  - ForesightManager
  - mouse prediction
  - tab prediction
  - Introduction
description: Introduction to ForesightJS, an lightweight JavaScript library with full TypeScript support that predicts user intent based on mouse movements and keyboard navigation
last_updated:
  date: 2025-06-06
  author: spaansba
---

# Introduction

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/js.foresight)](https://bundlephobia.com/package/js.foresight)
[![GitHub stars](https://img.shields.io/github/stars/spaansba/ForesightJS.svg?style=social&label=Star)](https://github.com/spaansba/ForesightJS)
[![GitHub last commit](https://img.shields.io/github/last-commit/spaansba/ForesightJS)](https://github.com/spaansba/ForesightJS/commits)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/demo-live-blue)](https://foresightjs.com/)

ForesightJS is a lightweight JavaScript library with full TypeScript support that predicts user intent based on mouse movements and keyboard navigation. By analyzing cursor trajectory and tab sequences, it anticipates which elements a user is likely to interact with, allowing developers to trigger actions before the actual hover or click occurs (for example prefetching).

### Understanding ForesightJS's Role:

When you over simplify prefetching it exists of three parts.

- **What** resource or data to load
- **How** the loading method and caching strategy is
- **When** the optimal moment to start fetching is

ForesightJS takes care of the **When** by predicting user intent with mouse trajectory and tab navigation.
You supply the **What** and **How** inside your `callback` when you register an element.

## Download

```bash
pnpm add js.foresight
# or
npm install js.foresight
# or
yarn add js.foresight
```

## Which problems does ForesightJS solve?

### Problem 1: On-Hover Prefetching Still Has Latency

Traditional hover-based prefetching only triggers after the user's cursor reaches an element. This approach wastes the critical 100-200ms window between when a user begins moving toward a target and when the hover event actually fires—time that could be used for prefetching.

### Problem 2: Viewport-Based Prefetching is Wasteful

Many modern frameworks (like Next.js) automatically prefetch resources for all links that enter the viewport. While well-intentioned, this creates significant overhead since users typically interact with only a small fraction of visible elements. Simply scrolling up and down the Next.js homepage can trigger **_1.59MB_** of unnecessary prefetch requests.

### Problem 3: Hover-Based Prefetching Excludes Keyboard Users

Many routers rely on hover-based prefetching, but this approach completely excludes keyboard users since keyboard navigation never triggers hover events. This means keyboard users miss out on the performance benefits that mouse users get from hover-based prefetching.

### The ForesightJS Solution

ForesightJS bridges the gap between wasteful viewport prefetching and basic hover prefetching. The `ForesightManager` predicts user interactions by analyzing mouse trajectory patterns and keyboard navigation sequences. This allows you to prefetch resources at the optimal time to improve performance, but targeted enough to avoid waste.

## Basic Usage Example

Both global and element speicif configuration details can be found [here](/docs/getting_started/config).

```javascript
import { ForesightManager } from "foresightjs"

// Initialize the manager if you want custom global settings (do this once at app startup)
// If you dont want global settings, you dont have to initialize the manager
ForesightManager.initialize({
  debug: false, // Set to true to see visualization
  trajectoryPredictionTime: 80, // How far ahead (in milliseconds) to predict the mouse trajectory
})

// Register an element to be tracked
const myButton = document.getElementById("my-button")

const { isTouchDevice, unregister } = ForesightManager.instance.register({
  element: myButton,
  callback: () => {
    // This is where your prefetching logic goes
  },
  hitSlop: 20, // Optional: "hit slop" in pixels. Overwrites defaultHitSlop
})

// Later, when done with this element:
unregister()
```

## What About Touch Devices?

ForesightJS focuses on using mouse movement for prefetching, so you'll need your own approach for touch devices like phones and tablets. The `ForesightManager.instance.register()` method returns an `isTouchDevice` boolean that you can use to create this separate logic. You can safely call `register()` even on touch devices, as the Foresight manager will bounce touch devices to avoid unnecessary processing.

An example of what to do with touch devices can be found in the [Next.js](/docs/2.0/integrations/nextjs) or [React Router](/docs/2.0/integrations/react) ForesightLink components.

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. While I haven't yet built integrations for every framework, ready-to-use implementations for [Next.js](/docs/2.0/integrations/nextjs) and [React Router](/docs/2.0/integrations/react) are already available. Sharing integrations for other frameworks/packages is highly appreciated!

## Configuration

ForesightJS can be used bare-bones but also can be configured. For all configuration possibilities you can reference the [docs](/docs/getting_started/config).

## Debugging Visualization

ForesightJS includes a [Visual Debugging](/docs/getting_started/debug) system that helps you understand and tune how foresight is working in your application. This is particularly helpful when setting up ForesightJS for the first time or when fine-tuning for specific UI components.

## How Does ForesightJS Work?

For a detailed technical explanation of its prediction algorithms and internal architecture, see the **[Behind the Scenes documentation](https://foresightjs.com/docs/Behind_the_Scenes)**.

## Providing Context to AI Tools

Since ForesightJS is a relatively new and unknown library, most AI assistants and large language models (LLMs) may not have comprehensive knowledge about it in their training data. To help AI assistants better understand and work with ForesightJS, you can provide them with context from our [llms.txt](https://foresightjs.com/llms.txt) page, which contains structured information about the library's API and usage patterns.

Additionally, every page in our documentation is available in markdown format (try adding .md to any documentation URL). You can share these markdown files as context with AI assistants, though all this information is also consolidated in the llms.txt file for convenience.

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md)
