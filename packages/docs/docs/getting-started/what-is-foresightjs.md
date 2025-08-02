---
sidebar_position: 1
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

# What is ForesightJS

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

## Understanding ForesightJS's Role

When you over simplify prefetching it exists of three parts:

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

Pick and choose multiple prediction strategies. All are enabled by default, but you can disable any of them when [initializing](/docs/getting-started/initialize-the-manager) the `ForesightManager`.

- **Mouse Trajectory** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Analyzes cursor movement patterns to predict which links users are heading towards and prefetches content before they arrive
- **Keyboard Navigation** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Tracks tab key usage and focus states to preload content for keyboard users navigating through your site
- **Scroll** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Prefetches content when users scroll towards registered elements, predicting which elements will be reached based on scroll direction

### Touch Devices (v3.3.0+)

While desktop systems use multiple concurrent prediction strategies, touch devices operate with a single active strategy that can be configured while [initializing](/docs/getting-started/initialize-the-manager) the `ForesightManager`.

- **onTouchStart** <span style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: '500'}}>default</span> - Captures the initial touch event to begin prefetching when users start interacting with registered elements
- **Viewport Enter** - Detects when registered elements enter the viewport and prefetches their content based on scroll behavior and visibility
- **None** - Disables ForesightJS on touch devices (previous behavior)

## Why ForesightJS?

ForesightJS is designed for developers who want to squeeze every drop of performance out of their web applications. It's a specialized tool, not something to drop into every project.

### Which problems does ForesightJS solve?

#### Problem 1: On-Hover Prefetching Still Has Latency

Traditional hover-based prefetching only triggers after the user's cursor reaches an element. This approach wastes the critical 100-200ms window between when a user begins moving toward a target and when the hover event actually fires—time that could be used for prefetching.

#### Problem 2: Viewport-Based Prefetching is Wasteful

Many modern frameworks (like Next.js) automatically prefetch resources for all links that enter the viewport. While well-intentioned, this creates significant overhead since users typically interact with only a small fraction of visible elements. Simply scrolling up and down the Next.js homepage can trigger **_1.59MB_** of unnecessary prefetch requests.

#### Problem 3: Hover-Based Prefetching Excludes Keyboard Users

Many routers rely on hover-based prefetching, but this approach completely excludes keyboard users since keyboard navigation never triggers hover events. This means keyboard users miss out on the performance benefits that mouse users get from hover-based prefetching.
