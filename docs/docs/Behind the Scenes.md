---
sidebar_position: 6
---

# Behind the Scenes

This page explains ForesightJS's core mechanisms. Learn about its event and observer setup, how mouse position is predicted, and how intersections with registered elements are found.

:::note
Reading this is not necessary to use the library; this is just for understanding how ForesightJS works.
:::

### ForesightManager Structure

ForesightJS uses a singleton pattern, meaning only one instance of `ForesightManager` exists. This single instance owns all prediction logic, elements, and global settings. Elements are stored in a `map` with the key being the registered element itself, calling `ForesightManager.instance.register()` multiple times with the same element will overwrite the previous value in the map instead of adding a duplicated element.

To keep the dom clean, ForesightJS captures `element.getBoundingClientRect()`, applies any `hitSlop`, and stores this expanded bounding box. This stored value requires constant updates due to document layout changes, handled by event listeners and observers.

### General Observers

ForesightJS uses browser Observers to monitor element positions and presence:

- **`MutationObserver`:** Detects when registered HTML elements are removed from the DOM, automatically unregistering them. It also monitors broader DOM structural changes. Such changes can alter element positions, prompting ForesightJS to re-evaluate all registered element bounds.
- **`ResizeObserver`:** ForesightJS attaches a `ResizeObserver` to each registered element to keep its bounding box accurate, even if the element's size changes.

## Mouse Prediction

### Event Handlers

ForesightJS captures mouse movement and monitors layout changes for accurate interaction detection:

- **`mousemove`:** Records the mouse's `clientX` and `clientY` coordinates. ForesightJS maintains a history of these positions, limited by `positionHistorySize`.
- **`resize` / `scroll`:** These global events update stored positions and dimensions of registered elements when the browser window resizes or the page scrolls. They are throttled for performance.

### How We Predict Mouse Position

ForesightJS predicts the mouse's future location using linear extrapolation based on its recent movement history.

The [`predictNextMousePosition`](https://github.com/spaansba/ForesightJS/blob/main/src/ForesightManager/helpers/predictNextMousePosition.ts) function operates in three steps:

1.  **History Tracking:** It stores past mouse positions with timestamps.
2.  **Velocity Calculation:** It calculates average velocity (change in position over time) from the oldest and newest points in history.
3.  **Extrapolation:** Using this calculated velocity and a specified `trajectoryPredictionTimeInMs` (how far into the future to predict), it projects the mouse's current position along its path to estimate its future `x` and `y` coordinates.

This process yields a `predictedPoint`. ForesightJS then draws a line segment in memory between the current mouse position and this `predictedPoint`.

### How We Check for Trajectory Intersections

To determine if the predicted mouse path will intersect with a registered element, ForesightJS uses the [`lineSegmentIntersectsRect`](https://github.com/spaansba/ForesightJS/blob/main/src/ForesightManager/helpers/lineSigmentIntersectsRect.ts) function, which implements the [**Liang-Barsky line clipping algorithm**](https://en.wikipedia.org/wiki/Liang%E2%80%93Barsky_algorithm).

This algorithm checks for intersection between the line segment (predicted mouse path) and a rectangular area (expanded bounds of a registered element).

The process involves:

1.  **Defining the Line Segment:** The line segment is defined by the `currentPoint` (actual mouse position) and the `predictedPoint`.
2.  **Defining the Rectangle:** The target rectangle is the `expandedRect` of a registered element, including its `hitSlop`.
3.  **Clipping Tests:** The algorithm iteratively "clips" the line segment against each of the rectangle's four edges. It calculates if and where the line segment crosses each edge.
4.  **Intersection Determination:** If a valid portion of the line segment remains after all clipping tests (meaning its entry point `t0` is less than or equal to its exit point `t1`), an intersection is confirmed.

This allows ForesightJS to predict if the user's future mouse trajectory will hit an element. If there is a hit we call the elements' `callback` function.

## Tab Prediction

### Event Handlers

For tab prediction, ForesightJS monitors keyboard and focus events:

- **`keydown`:** Checks if the `Tab` key was the last key pressed.
- **`focusin`:** Fires when an element gains focus. When combined with `keydown` (checking for `Tab` press), ForesightJS identifies tab navigation.

These listeners are also managed by an `AbortController`.

### How We Predict Tab Navigation

When ForesightJS detects a `Tab` key press followed by a `focusin` event, it recognizes tab navigation. It uses the [`tabbable`](https://github.com/focus-trap/tabbable) library to identify all current tabbable elements.

The prediction logic:

1.  **Identify Current Focus:** It determines the index of the element that just received focus within the ordered list of all tabbable elements.
2.  **Determine Tab Direction:** It checks for the `Shift` key to ascertain tabbing direction (forward or backward).
3.  **Calculate Prediction Range:** Based on tab direction and `tabOffset`, it defines a range of potential next focusable elements.
4.  **Trigger Callbacks:** If this range contain any registered elements, call their `callback` functions
