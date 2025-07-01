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
  author: spaansba
---

# Behind the Scenes

:::note
Reading this is not necessary to use the library; this is just for understanding how ForesightJS works.
:::

This document delves into the internal workings of ForesightJS, offering a look "behind the scenes" at its architecture and prediction logic. While understanding these details isn't necessary for using the library, it provides insight into how ForesightJS manages elements, observes changes, and predicts user interactions like mouse movements and tab navigation. The following sections explore the core `ForesightManager`, the observers it employs, and the algorithms behind its predictive capabilities.

### ForesightManager Structure

ForesightJS employs a singleton pattern, ensuring only one instance of `ForesightManager` exists. This central instance manages all prediction logic, registered elements, and global settings. Elements are stored in a `Map`, where the key is the registered element itself. Calling `ForesightManager.instance.register()` multiple times with the same element overwrites the existing entry rather than creating a duplicate.

To keep the dom clean and optimize for performance, ForesightJS captures an element's `getBoundingClientRect()`, applies any configured `hitSlop` and stores this expanded bounding box. This stored bounding box requires continuous updates to reflect document layout changes, a task handled by various event listeners and observers.

### General Observers

ForesightJS utilizes browser-native Observers to monitor element positions and their presence in the DOM:

- **`MutationObserver`:** This observer detects when registered HTML elements are removed from the DOM, leading to their automatic unregistration. It also monitors broader DOM structural changes. Since such changes can alter element positions, they prompt ForesightJS to re-evaluate the bounds of all registered elements.
- **`ResizeObserver`:** A `ResizeObserver` is attached to each registered element. This ensures its stored bounding box remains accurate even if the element's own dimensions change.

## Mouse Prediction

### Event Handlers

For accurate mouse interaction detection, ForesightJS captures mouse movements and monitors layout changes:

- **`mousemove`:** The library records the mouse's `clientX` and `clientY` coordinates on each `mousemove` event. ForesightJS maintains a history of these positions, the size of which is limited by the `positionHistorySize` setting.
- **`resize` / `scroll`:** Global `resize` and `scroll` events trigger updates to the stored positions and dimensions of registered elements. To maintain performance, these event handlers are throttled.

### Mouse Position Prediction Mechanism

ForesightJS predicts the mouse's future location using linear extrapolation based on its recent movement history.

The [`predictNextMousePosition`](https://github.com/spaansba/ForesightJS/blob/main/src/ForesightManager/helpers/predictNextMousePosition.ts) function implements this in three main steps:

1.  **History Tracking:** The function utilizes stored past mouse positions, each with an associated timestamp.
2.  **Velocity Calculation:** It calculates the average velocity (change in position over time) using the oldest and newest points in the recorded history.
3.  **Extrapolation:** Using this calculated velocity and the `trajectoryPredictionTimeInMs` setting (which defines how far into the future to predict), the function projects the mouse's current position along its path to estimate its future `x` and `y` coordinates.

This process yields a `predictedPoint`. ForesightJS then creates a line in memory between the current mouse position and this `predictedPoint` for intersection checks.

### Trajectory Intersection Checking

To determine if the predicted mouse path will intersect with a registered element, ForesightJS employs the [`lineSegmentIntersectsRect`](https://github.com/spaansba/ForesightJS/blob/main/src/ForesightManager/helpers/lineSigmentIntersectsRect.ts) function. This function implements the [**Liang-Barsky line clipping algorithm**](https://en.wikipedia.org/wiki/Liang%E2%80%93Barsky_algorithm), an efficient method for checking intersections between a line segment (the predicted mouse path) and a rectangular area (the expanded bounds of a registered element).

The process involves:

1.  **Defining the Line Segment:** The line segment is defined by the `currentPoint` (current mouse position) and the `predictedPoint` (from the extrapolation step).
2.  **Defining the Rectangle:** The target rectangle is the `expandedRect` of a registered element, which includes its `hitSlop`.
3.  **Clipping Tests:** The algorithm iteratively "clips" the line segment against each of the rectangle's four edges, calculating if and where the line segment crosses each edge.
4.  **Intersection Determination:** An intersection is confirmed if a valid portion of the line segment remains after all clipping tests (specifically, if its calculated entry parameter \(t_0\) is less than or equal to its exit parameter \(t_1\)).

This mechanism allows ForesightJS to predict if the user's future mouse trajectory will intersect an element. If an intersection is detected, the element's registered `callback` function is invoked.

## Tab Prediction

### Event Handlers

For tab prediction, ForesightJS monitors specific keyboard and focus events:

- **`keydown`:** The library listens for `keydown` events to check if the `Tab` key was the last key pressed.
- **`focusin`:** This event fires when an element gains focus. When a `focusin` event follows a `Tab` key press detected via `keydown`, ForesightJS identifies this sequence as tab navigation.

These event listeners are managed by an `AbortController` for proper cleanup.

### Tab Navigation Prediction

When ForesightJS detects a `Tab` key press followed by a `focusin` event, it recognizes this as user-initiated tab navigation. Identifying all currently tabbable elements on a page is a surprisingly complex task due to varying browser behaviors, element states, and accessibility considerations. Therefore, to reliably determine the tab order, ForesightJS leverages the robust and well-tested [`tabbable`](https://github.com/focus-trap/tabbable) library.

The prediction logic then proceeds as follows:

1.  **Identify Current Focus:** ForesightJS determines the index of the newly focused element within the ordered list of all tabbable elements provided by the `tabbable` library.
2.  **Determine Tab Direction:** The library checks if the `Shift` key was held during the `Tab` press to ascertain the tabbing direction (forward or backward).
3.  **Calculate Prediction Range:** Based on the current focused element's index, the tab direction, and the configured `tabOffset`, ForesightJS defines a range of elements that are likely to receive focus next.
4.  **Trigger Callbacks:** If any registered ForesightJS elements fall within this predicted range, their respective `callback` functions are invoked.
