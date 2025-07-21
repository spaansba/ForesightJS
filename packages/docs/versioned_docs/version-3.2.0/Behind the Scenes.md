---
sidebar_position: 6
slug: Behind_the_Scenes
keywords:
  - ForesightJS
  - JS.Foresight
  - user intent prediction
  - mouse prediction
  - tab prediction
  - prefetching
  - Liang-Barsky
  - internal architecture
description: A technical deep-dive into the internal workings of ForesightJS, explaining its architecture, how it predicts mouse movements using linear extrapolation and the Liang-Barsky algorithm, and how it predicts tab navigation.
last_updated:
  date: 2025-06-04
  author: Bart Spaans
---

# Behind the Scenes

:::note
Reading this is not necessary to use the library; this is just for understanding how ForesightJS works.
:::

This document delves into the internal workings of ForesightJS, offering a look "behind the scenes" at its architecture and prediction logic. While understanding these details isn't necessary for using the library, it provides insight into how ForesightJS manages elements, observes changes, and predicts user interactions like mouse movements and tab navigation. The following sections explore the core `ForesightManager`, the observers it employs, and the algorithms behind its predictive capabilities.

### ForesightManager Structure

ForesightJS employs a singleton pattern, ensuring only one instance of `ForesightManager` exists. This central instance manages all prediction logic, registered elements, and global settings. Elements are stored in a `Map`, where the key is the registered element itself. Calling `ForesightManager.instance.register()` multiple times with the same element overwrites the existing entry rather than creating a duplicate.

Since the DOM and registered elements might change position, and we want to keep the DOM clean, we require the [`element.getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) for each element on each update. However, calling this function can trigger [reflows](https://developer.mozilla.org/en-US/docs/Glossary/Reflow), which we want to avoid. To obtain this rect and manage registered element state, we use observers instead.

### Observer Architecture

ForesightJS utilizes both browser-native observers and a third-party observer library to monitor element positions and DOM changes:

- **`MutationObserver`:** This browser-native observer detects when registered elements are removed from the DOM, leading to their automatic unregistration. This provides a safety net if developers forget to manually unregister elements on removal.

- **[`PositionObserver`](https://github.com/Shopify/position-observer/):** Created by [Shopify](https://github.com/Shopify), this library uses browser-native observers under the hood to asynchronously monitor changes in the position of registered elements without polling.

The `PositionObserver` works by using a layered approach to track element position changes across the page. It uses an internal `VisibilityObserver` built on the native `IntersectionObserver` to determine if target elements are visible in the viewport. This optimization means only visible targets are monitored for position changes.

When a target element becomes visible, the system activates a `ResizeObserver` to track size changes of the target element itself. Next to that each target gets its own `PositionIntersectionObserverOptions` containing an internal `IntersectionObserver` with smart rootMargin calculations.

This smart rootMargin transforms the observer from "observing against viewport" to "observing against the target element". By calculating the rootMargin values, the system creates target-specific observation regions. Other elements on the page are observed by these target-specific IntersectionObservers, and when any element moves and intersects or overlaps with a target, callbacks fire. This enables tracking any position changes affecting the target elements without constantly polling `getBoundingClientRect()` on every element.

## Element Lifecycle

Understanding the lifecycle of registered elements is crucial for effective use of ForesightJS. Each registered element follows a predictable lifecycle from registration to potential cleanup:

### Registration Flow

1. **Element Registration:** When `ForesightManager.instance.register(element, options)` is called, the element is added to the internal Map with its configuration and initial state.

2. **Callback Execution:** When user intent is detected (mouse trajectory, tab navigation, or scroll prediction), the element's registered callback function is triggered.

3. **Callback Deactivation:** After a callback executes, the element's `isCallbackActive` property is automatically set to `false`, preventing the callback from firing again immediately.

4. **Reactivation Wait:** The element remains in this deactivated state for a duration specified by the `reactivateAfter` option (defaults to infinity, meaning the callback won't reactivate unless manually triggered).

5. **Callback Reactivation:** Once the `reactivateAfter` duration elapses, `isCallbackActive` is set back to `true`, allowing the callback to fire again when user intent is detected.

6. **Lifecycle Continuation:** The element returns to step 2, ready to detect and respond to user intent again.

### Element Cleanup

Elements can be removed from ForesightJS tracking in several ways:

- **Manual Unregistration:** Developers can explicitly remove elements using `ForesightManager.instance.unregister(element)`.
- **Automatic DOM Cleanup:** When elements are removed from the DOM, the `MutationObserver` automatically detects this change and unregisters them.

## Mouse Prediction

Mouse prediction analyzes cursor movement patterns to anticipate where users intend to click. By tracking mouse velocity and trajectory, ForesightJS can predict when a user's cursor path will intersect with registered elements.

### Event Handlers

- **`mousemove`:** Records the mouse's `clientX` and `clientY` coordinates on each `mousemove` event. ForesightJS maintains a history of these positions, with the history size limited by the `positionHistorySize` setting.

### Mouse Position Prediction Mechanism

ForesightJS predicts the mouse's future location using linear extrapolation based on its recent movement history.

The [`predictNextMousePosition`](https://github.com/spaansba/ForesightJS/blob/main/packages/js.foresight/src/helpers/predictNextMousePosition.ts) function implements this in three main steps:

1.  **History Tracking:** The function utilizes stored past mouse positions, each with an associated timestamp.
2.  **Velocity Calculation:** It calculates the average velocity (change in position over time) using the oldest and newest points in the recorded history.
3.  **Extrapolation:** Using this calculated velocity and the `trajectoryPredictionTimeInMs` setting (which defines how far into the future to predict), the function projects the mouse's current position along its path to estimate its future `x` and `y` coordinates.

This process yields a `predictedPoint` which allows for a line in memory between the current mouse position and this `predictedPoint` for intersection checks. It only checks elements that are currently visible in the viewport, as determined by the `PositionObserver`.

### Trajectory Intersection Checking

To determine if the predicted mouse path will intersect with a registered element, ForesightJS employs the [`lineSegmentIntersectsRect`](https://github.com/spaansba/ForesightJS/blob/main/src/foresightManager/helpers/lineSigmentIntersectsRect.ts) function. This function implements the [**Liang-Barsky line clipping algorithm**](https://en.wikipedia.org/wiki/Liang%E2%80%93Barsky_algorithm), an efficient method for checking intersections between a line segment (the predicted mouse path) and a rectangular area (the expanded bounds of a registered element).

The process involves:

1.  **Defining the Line Segment:** The line segment is defined by the `currentPoint` (current mouse position) and the `predictedPoint` (from the extrapolation step).
2.  **Defining the Rectangle:** The target rectangle is the `expandedRect` of a registered element, which includes its `hitSlop`.
3.  **Clipping Tests:** The algorithm iteratively "clips" the line segment against each of the rectangle's four edges, calculating if and where the line segment crosses each edge.
4.  **Intersection Determination:** An intersection is confirmed if a valid portion of the line segment remains after all clipping tests (specifically, if its calculated entry parameter \(t_0\) is less than or equal to its exit parameter \(t_1\)).

This mechanism allows ForesightJS to predict if the user's future mouse trajectory will intersect an element. If an intersection is detected, the element's registered `callback` function is invoked.

## Tab Prediction

Tab prediction anticipates keyboard navigation by monitoring Tab key presses and focus changes. When users navigate through tabbable elements using the Tab key,

### Event Handlers

For tab prediction, ForesightJS monitors specific keyboard and focus events:

- **`keydown`:** Listens for `keydown` events to detect when the `Tab` key was pressed.
- **`focusin`:** Fires when an element gains focus. When a `focusin` event follows a `Tab` key press detected via `keydown`, ForesightJS identifies this sequence as tab navigation.

These event listeners are managed by an `AbortController` for proper cleanup.

### Tab Navigation Prediction

When ForesightJS detects a `Tab` key press followed by a `focusin` event, it recognizes this as user-initiated tab navigation. Identifying all currently tabbable elements on a page is a surprisingly complex task due to varying browser behaviors, element states, and accessibility considerations. Therefore, to reliably determine the tab order, ForesightJS uses the [`tabbable`](https://github.com/focus-trap/tabbable) library.

To optimize performance, ForesightJS caches the results from the `tabbable` library since calling `tabbable()` can be computationally expensive as it uses `element.getBoundingClientRect()` under the hood. The cache is invalidated and refreshed whenever DOM mutations are detected, ensuring the tab order remains accurate even as the page structure changes.

The prediction logic then proceeds as follows:

1.  **Identify Current Focus:** ForesightJS determines the index of the newly focused element within the ordered list of all tabbable elements provided by the `tabbable` library.
2.  **Determine Tab Direction:** The library checks if the `Shift` key was held during the `Tab` press to ascertain the tabbing direction (forward or backward).
3.  **Calculate Prediction Range:** Based on the current focused element's index, the tab direction, and the configured `tabOffset`, ForesightJS defines a range of elements that are likely to receive focus next.
4.  **Trigger Callbacks:** If any registered ForesightJS elements fall within this predicted range, their respective `callback` functions are invoked.

## Scroll Prediction

The final prediction mechanism leverages the existing observer infrastructure to detect scroll-based user intent without additional event listeners.

Unlike mouse and tab prediction, scroll prediction does not require additional event handlers. The `PositionObserver` callback returns an array of elements that have moved in some way. By analyzing the delta between the previous `boundingClientRect` and the new one for elements that remain in the viewport, we can determine the direction elements are moving and thus infer the scroll direction.

Note that this approach may also trigger in other scenarios where elements move, such as animations or dynamic layout changes. If your website has many such animations, you may need to disable scroll prediction entirely.
