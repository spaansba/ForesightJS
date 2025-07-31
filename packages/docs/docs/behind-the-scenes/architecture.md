---
sidebar_position: 1
keywords:
  - ForesightJS
  - architecture
  - structure
  - singleton
description: How ForesightJS is architected and why certain design decisions were made
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# Architecture & Structure

ForesightJS employs a singleton pattern, ensuring only one instance of `ForesightManager` exists. This central instance manages all prediction logic, registered elements, and global settings. Elements are stored in a `Map`, where the key is the registered element itself. Calling `ForesightManager.instance.register()` multiple times with the same element overwrites the existing entry rather than creating a duplicate.

Since the DOM and registered elements might change position, and we want to keep the DOM clean, we require the [`element.getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) for each element on each update. However, calling this function can trigger [reflows](https://developer.mozilla.org/en-US/docs/Glossary/Reflow), which we want to avoid. To obtain this rect and manage registered element state, we use observers instead.

## Observer Architecture

ForesightJS utilizes both browser-native observers and a third-party observer library to monitor element positions and DOM changes:

- **`MutationObserver`:** This browser-native observer detects when registered elements are removed from the DOM, leading to their automatic unregistration. This provides a safety net if developers forget to manually unregister elements on removal.

- **[`PositionObserver`](https://github.com/Shopify/position-observer/):** Created by [Shopify](https://github.com/Shopify), this library uses browser-native observers under the hood to asynchronously monitor changes in the position of registered elements without polling.

The `PositionObserver` works by using a layered approach to track element position changes across the page. It uses an internal `VisibilityObserver` built on the native `IntersectionObserver` to determine if target elements are visible in the viewport. This optimization means only visible targets are monitored for position changes.

When a target element becomes visible, the system activates a `ResizeObserver` to track size changes of the target element itself. Next to that each target gets its own `PositionIntersectionObserverOptions` containing an internal `IntersectionObserver` with smart rootMargin calculations.

This smart rootMargin transforms the observer from "observing against viewport" to "observing against the target element". By calculating the rootMargin values, the system creates target-specific observation regions. Other elements on the page are observed by these target-specific IntersectionObservers, and when any element moves and intersects or overlaps with a target, callbacks fire. This enables tracking any position changes affecting the target elements without constantly polling `getBoundingClientRect()` on every element.