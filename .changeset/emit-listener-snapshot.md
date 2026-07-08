---
"js.foresight": patch
"js.foresight-devtools": patch
---

Store event listeners in a `Set` instead of an array. Iterating a `Set` during `emit` means a listener that unsubscribes another mid-dispatch no longer causes the next listener to be skipped, and registration now dedupes like the DOM `addEventListener`.
