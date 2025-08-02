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

## Architecture

ForesightJS uses a singleton pattern with `ForesightManager` as the central instance managing all prediction logic, registered elements, and global settings. Elements are stored in a `Map` where the key is the registered element itself. Multiple registrations of the same element overwrite the existing entry.

Since DOM elements can change position and we need to keep the DOM clean, we require `element.getBoundingClientRect()` for each element on each update. To avoid triggering reflows, ForesightJS uses observers:

- **`MutationObserver`**: Detects when registered elements are removed from the DOM for automatic unregistration
- **`PositionObserver`**: Shopify's library that asynchronously monitors element position changes without polling

The `PositionObserver` uses layered observation:
1. `VisibilityObserver` (built on `IntersectionObserver`) determines if elements are viewport-visible
2. `ResizeObserver` tracks size changes of visible target elements
3. Target-specific `IntersectionObserver` instances with smart rootMargin calculations transform viewport observation into target-specific observation regions

## Keyboard & Mouse Users

### Mouse Prediction

Mouse prediction tracks cursor movement patterns to anticipate click targets by analyzing velocity and trajectory.

**Event Handling**: `mousemove` events record `clientX` and `clientY` coordinates. Position history is limited by `positionHistorySize` setting.

**Prediction Algorithm**: The `predictNextMousePosition` function implements linear extrapolation:
1. **History Tracking**: Stores past mouse positions with timestamps
2. **Velocity Calculation**: Calculates average velocity using oldest and newest points in history
3. **Extrapolation**: Projects current position along trajectory using calculated velocity and `trajectoryPredictionTimeInMs` setting

**Intersection Detection**: The `lineSegmentIntersectsRect` function implements the Liang-Barsky line clipping algorithm to check intersections between the predicted mouse path and element rectangles:
1. Line segment defined by current and predicted mouse positions
2. Target rectangle includes element's `hitSlop`
3. Algorithm clips line segment against rectangle's four edges
4. Intersection confirmed if entry parameter ≤ exit parameter

### Keyboard Prediction

Tab prediction monitors keyboard navigation by detecting Tab key presses and focus changes.

**Event Handling**:
- `keydown`: Detects Tab key presses
- `focusin`: Fires when elements gain focus

When `focusin` follows a Tab `keydown`, ForesightJS identifies this as tab navigation.

**Tab Navigation Logic**: Uses the `tabbable` library to determine tab order. Results are cached for performance since `tabbable()` calls `getBoundingClientRect()` internally. Cache invalidates on DOM mutations.

Prediction process:
1. Identify current focused element's index in tabbable elements list
2. Determine tab direction (forward/backward based on Shift key)
3. Calculate prediction range using current index, direction, and `tabOffset`
4. Trigger callbacks for registered elements within predicted range

### Scroll Prediction

Leverages existing observer infrastructure without additional event listeners. The `PositionObserver` callback provides elements that have moved. By analyzing the delta between previous and new `boundingClientRect` for viewport-remaining elements, ForesightJS infers scroll direction.

Note: This also triggers during animations or dynamic layout changes.

## Touch Device Users

Touch devices require different prediction strategies due to the lack of continuous cursor movement. ForesightJS provides two strategies via the `touchDeviceStrategy` prop:

**Viewport Entry**: Uses `IntersectionObserver` to detect when elements enter the viewport. Callbacks trigger when elements become visible during scrolling, providing anticipatory loading for content that will soon be in view.

**Touch Start**: Listens for `touchstart` events on registered elements. Callbacks fire immediately when users begin touching an element, before the actual `click` event occurs, providing a performance advantage for touch interactions.

## Element Lifecycle

1. **Registration**: `ForesightManager.instance.register(element, options)` adds element to internal Map
2. **Callback Execution**: When user intent is detected, element's callback function triggers
3. **Deactivation**: `isCallbackActive` set to `false` after callback execution
4. **Reactivation Wait**: Element remains deactivated for `reactivateAfter` duration (defaults to infinity)
5. **Reactivation**: `isCallbackActive` reset to `true` after duration elapses

**Cleanup**: Elements removed via `ForesightManager.instance.unregister(element)` or automatically when DOM removal is detected by `MutationObserver`.
