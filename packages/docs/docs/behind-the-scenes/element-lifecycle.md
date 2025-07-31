---
sidebar_position: 2
keywords:
  - ForesightJS
  - element lifecycle
  - registration
  - cleanup
description: How elements move through their lifecycle in ForesightJS
last_updated:
  date: 2025-07-31
  author: Bart Spaans
---

# Element Lifecycle

Understanding the lifecycle of registered elements is crucial for effective use of ForesightJS. Each registered element follows a predictable lifecycle from registration to potential cleanup:

## Registration Flow

1. **Element Registration:** When `ForesightManager.instance.register(element, options)` is called, the element is added to the internal Map with its configuration and initial state.

2. **Callback Execution:** When user intent is detected (mouse trajectory, tab navigation, or scroll prediction), the element's registered callback function is triggered.

3. **Callback Deactivation:** After a callback executes, the element's `isCallbackActive` property is automatically set to `false`, preventing the callback from firing again immediately.

4. **Reactivation Wait:** The element remains in this deactivated state for a duration specified by the `reactivateAfter` option (defaults to infinity, meaning the callback won't reactivate unless manually triggered).

5. **Callback Reactivation:** Once the `reactivateAfter` duration elapses, `isCallbackActive` is set back to `true`, allowing the callback to fire again when user intent is detected.

6. **Lifecycle Continuation:** The element returns to step 2, ready to detect and respond to user intent again.

## Element Cleanup

Elements can be removed from ForesightJS tracking in several ways:

- **Manual Unregistration:** Developers can explicitly remove elements using `ForesightManager.instance.unregister(element)`.
- **Automatic DOM Cleanup:** When elements are removed from the DOM, the `MutationObserver` automatically detects this change and unregisters them.