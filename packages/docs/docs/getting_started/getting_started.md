---
sidebar_position: 0
keywords:
  - Introduction
  - JS.Foresight
  - ForesightManager
  - mouse prediction
  - tab prediction
  - mobile prefetching
  - desktop prefetching
description: Introduction to ForesightJS, an lightweight JavaScript library with full TypeScript support that predicts user intent based on mouse movements and keyboard navigation
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# Getting Started

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/js.foresight)](https://bundlephobia.com/package/js.foresight)
[![GitHub last commit](https://img.shields.io/github/last-commit/spaansba/ForesightJS)](https://github.com/spaansba/ForesightJS/commits)

[![GitHub stars](https://img.shields.io/github/stars/spaansba/ForesightJS.svg?style=social&label=Star)](https://github.com/spaansba/ForesightJS)
[![Best of JS](https://img.shields.io/endpoint?url=https://bestofjs-serverless.now.sh/api/project-badge?fullName=spaansba%2FForesightJS%26since=daily)](https://bestofjs.org/projects/foresightjs)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/demo-live-blue)](https://foresightjs.com#playground)

ForesightJS is a lightweight JavaScript library that predicts user intent to prefetch content before it's needed. **It works completely out of the box without configuration**, supporting both desktop and mobile devices with different prediction strategies.

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

## Prediction Strategies

ForesightJS uses different prediction strategies depending on the device type. For limited connections (2G or data-saver mode), we respect the user's preference to minimize data usage and skip registration.

### Keyboard/Mouse Users

Pick and choose multiple prediction strategies:

- **Mouse Trajectory** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Analyzes cursor movement patterns to predict which links users are heading towards and prefetches content before they arrive
- **Keyboard Navigation** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Tracks tab key usage and focus states to preload content for keyboard users navigating through your site
- **Scroll** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Prefetches content when users scroll towards registered elements, predicting which elements will be reached based on scroll direction

### Touch Devices (v3.3.0+)

ForesightJS now supports touch devices through the configurable `touchDeviceStrategy`. See the [TouchDeviceStrategy configuration](/docs/getting_started/config#touch-device-strategy-v330) for details.

Available strategies:

- **Viewport Enter** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Detects when registered elements enter the viewport and prefetches their content based on scroll behavior and visibility
- **onTouchStart** - Captures the initial touch event to begin prefetching when users start interacting with registered elements
- **None** - Disables ForesightJS on touch devices (previous behavior)

## Which problems does ForesightJS solve?

### Problem 1: On-Hover Prefetching Still Has Latency

Traditional hover-based prefetching only triggers after the user's cursor reaches an element. This approach wastes the critical 100-200ms window between when a user begins moving toward a target and when the hover event actually fires—time that could be used for prefetching.

### Problem 2: Viewport-Based Prefetching is Wasteful

Many modern frameworks (like Next.js) automatically prefetch resources for all links that enter the viewport. While well-intentioned, this creates significant overhead since users typically interact with only a small fraction of visible elements. Simply scrolling up and down the Next.js homepage can trigger **_1.59MB_** of unnecessary prefetch requests.

### Problem 3: Hover-Based Prefetching Excludes Keyboard Users

Many routers rely on hover-based prefetching, but this approach completely excludes keyboard users since keyboard navigation never triggers hover events. This means keyboard users miss out on the performance benefits that mouse users get from hover-based prefetching.

### The ForesightJS Solution

ForesightJS bridges the gap between wasteful viewport prefetching and basic hover prefetching. The `ForesightManager` predicts user interactions by analyzing mouse trajectory patterns, scroll direction and keyboard navigation sequences. This allows you to prefetch resources at the optimal time to improve performance, but targeted enough to avoid waste.

## Basic Usage Example

This basic example is in vanilla JS, ofcourse most people will use ForesightJS with a framework. You can read about framework integrations in the [docs](/docs/integrations).

```javascript
import { ForesightManager } from "foresightjs"

// Register an element to be tracked
const myButton = document.getElementById("my-button")

// isTouchDevice can be used to change prefetch behaviour if the user is on a touch device
const { isTouchDevice } = ForesightManager.instance.register({
  element: myButton,
  callback: () => {
    // This is where your prefetching logic goes
  },
  hitSlop: 20, // Optional: "hit slop" in pixels. Overwrites defaultHitSlop
})
```

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. While I haven't yet built [integrations](/docs/integrations) for every framework, ready-to-use implementations for [Next.js](/docs/integrations/react/nextjs) and [React Router](/docs/integrations/react/react-router) are already available. Sharing integrations for other frameworks/packages is highly appreciated!

## Configuration

ForesightJS can be used bare-bones but also can be configured. For all configuration possibilities you can reference the [docs](/docs/getting_started/config).

## Development Tools

ForesightJS has dedicated [Development Tools](/docs/getting_started/development_tools) created with [Foresight Events](/docs/getting_started/events) that help you understand and tune how foresight is working in your application. This standalone development package provides real-time visualization of mouse trajectory predictions, element bounds, and callback execution.

```bash
npm install js.foresight-devtools
```

```javascript
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize development tools
ForesightDevtools.initialize({
  showNameTags: true,
  sortElementList: "visibility",
})
```

This is particularly helpful when setting up ForesightJS for the first time or when fine-tuning for specific UI components.

## How Does ForesightJS Work?

For a detailed technical explanation of its prediction algorithms and internal architecture, see the **[Behind the Scenes documentation](https://foresightjs.com/docs/Behind_the_Scenes)**.

## Providing Context to AI Tools

ForesightJS is a newer library, so most AI assistants and LLMs may not have much built-in knowledge about it. To improve their responses, you can provide the following context:

- Use [llms.txt](https://foresightjs.com/llms.txt) for a concise overview of the API and usage patterns.
- Use [llms-full.txt](https://foresightjs.com/llms-full.txt) for a full markdown version of the docs, ideal for AI tools that support context injection or uploads.
- All documentation pages are also available in markdown. You can view them by adding .md to the end of any URL, for example: https://foresightjs.com/docs/getting_started.md.

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md)
