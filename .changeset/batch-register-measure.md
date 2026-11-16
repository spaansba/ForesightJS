---
"js.foresight": patch
---

Measure newly registered elements in one batch after the registering task instead of inside `register()`. Registering thousands of elements while a framework inserts them (Vue function refs) no longer forces a layout per element. `getBounds()` and `isIntersectingWithViewport` now get their first values right after the registering task
