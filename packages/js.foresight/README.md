# [ForesightJS](https://foresightjs.com/)

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/js.foresight)](https://bundlephobia.com/package/js.foresight)
[![GitHub last commit](https://img.shields.io/github/last-commit/spaansba/ForesightJS)](https://github.com/spaansba/ForesightJS/commits)

[![GitHub stars](https://img.shields.io/github/stars/spaansba/ForesightJS.svg?style=social&label=Star)](https://github.com/spaansba/ForesightJS)
[![Best of JS](https://img.shields.io/endpoint?url=https://bestofjs-serverless.now.sh/api/project-badge?fullName=spaansba%2FForesightJS%26since=daily)](https://bestofjs.org/projects/foresightjs)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/demo-live-blue)](https://foresightjs.com#playground)
ForesightJS is a lightweight JavaScript library with full TypeScript support that predicts user intent based on mouse movements, scroll and keyboard navigation. By analyzing cursor/scroll trajectory and tab sequences, it anticipates which elements a user is likely to interact with, allowing developers to trigger actions before the actual hover or click occurs (for example prefetching).

### [Playground](https://foresightjs.com/)

![](https://github.com/user-attachments/assets/f5650c63-4489-4878-bd72-d8954c6a739b)
_In the GIF above, the [ForesightJS DevTools](https://foresightjs.com/docs/getting_started/development_tools) are enabled. Normally, users won't see anything that ForesightJS does except the increased perceived speed from early prefetching._

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

Traditional hover-based prefetching only triggers after the user's cursor reaches an element. This approach wastes the critical 100-200ms window between when a user begins moving toward a target and when the hover event actually fires.

### Problem 2: Viewport-Based Prefetching is Wasteful

Many modern frameworks (like Next.js) automatically prefetch resources for all links that enter the viewport. While well-intentioned, this creates significant overhead since users typically interact with only a small fraction of visible elements. Simply scrolling up and down the Next.js homepage can trigger **_1.59MB_** of unnecessary prefetch requests.

### Problem 3: Hover-Based Prefetching Excludes Keyboard Users

Many routers rely on hover-based prefetching, but this approach completely excludes keyboard users since keyboard navigation never triggers hover events. This means keyboard users miss out on the performance benefits that mouse users get from hover-based prefetching.

### The ForesightJS Solution

ForesightJS bridges the gap between wasteful viewport prefetching and basic hover prefetching. The `ForesightManager` predicts user interactions by analyzing mouse trajectory patterns, scroll direction and keyboard navigation sequences. This allows you to prefetch resources at the optimal time to improve performance, but targeted enough to avoid waste.

## Basic Usage Example

This basic example is in vanilla JS, ofcourse most people will use ForesightJS with a framework. You can read about framework integrations in the [docs](https://foresightjs.com/docs/integrations).

```javascript
import { ForesightManager } from "foresightjs"

// Initialize the manager if you want custom global settings (do this once at app startup)
ForesightManager.initialize({
  // Optional props (see configuration)
})

// Register an element to be tracked
const myButton = document.getElementById("my-button")

const { isTouchDevice } = ForesightManager.instance.register({
  element: myButton,
  callback: () => {
    // This is where your prefetching logic goes
  },
  hitSlop: 20, // Optional: "hit slop" in pixels. Overwrites defaultHitSlop
  // other optional props (see configuration)
})
```

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. While I haven't yet built [integrations](https://foresightjs.com/docs/integrations) for every framework, ready-to-use implementations for [Next.js](https://foresightjs.com/docs/integrations/react/nextjs) and [React Router](https://foresightjs.com/docs/integrations/react/react-router) are already available. Sharing integrations for other frameworks/packages is highly appreciated!

## Configuration

ForesightJS can be used bare-bones but also can be configured. For all configuration possibilities you can reference the [docs](https://foresightjs.com/docs/getting_started/config).

## Development Tools

ForesightJS has dedicated [Development Tools](https://github.com/spaansba/ForesightJS-DevTools) created with [Foresight Events](https://foresightjs.com/docs/getting_started/events) that help you understand and tune how foresight is working in your application. This standalone development package provides real-time visualization of mouse trajectory predictions, element bounds, and callback execution. It's particularly helpful when setting up ForesightJS for the first time or when fine-tuning for specific UI components.

```bash
npm install js.foresight-devtools
```

See the [development tools documentation](https://foresightjs.com/docs/getting_started/debug) for more details.

## What About Touch Devices and Slow Connections?

Since ForesightJS relies on the keyboard/mouse it will not register elements for touch devices. For limited connections (2G or data-saver mode), we respect the user's preference to minimize data usage and skip registration aswell.

The `ForesightManager.instance.register()` method returns these properties:

- `isTouchDevice` - true if user is on a touch device
- `isLimitedConnection` - true when user is on a 2G connection or has data-saver enabled
- `isRegistered` - true if element was actually registered

With these properties you could create your own fallback prefetching methods if required. For example if the user is on a touch device you could prefetch based on viewport.
An example of this can be found in the [Next.js](https://foresightjs.com/docs/integrations/react/nextjs) or [React Router](https://foresightjs.com/docs/integrations/react/react-router) ForesightLink components.

## How Does ForesightJS Work?

For a detailed technical explanation of its prediction algorithms and internal architecture, see the **[Behind the Scenes documentation](https://foresightjs.com/docs/Behind_the_Scenes)**.

## Providing Context to AI Tools

ForesightJS is a newer library, so most AI assistants and LLMs may not have much built-in knowledge about it. To improve their responses, you can provide the following context:

- Use [llms.txt](https://foresightjs.com/llms.txt) for a concise overview of the API and usage patterns.
- Use [llms-full.txt](https://foresightjs.com/llms-full.txt) for a full markdown version of the docs, ideal for AI tools that support context injection or uploads.
- All documentation pages are also available in markdown. You can view them by adding .md to the end of any URL, for example: https://foresightjs.com/docs/getting_started.md.

# Contributing

Please see the [contributing guidelines](/CONTRIBUTING.md)
