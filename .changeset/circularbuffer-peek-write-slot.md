---
"js.foresight": patch
---

`CircularBuffer` now exposes `peekWriteSlot()` for zero-allocation slot reuse and drops the unused `getFirstLast()` tuple accessor in favor of `getFirst()`/`getLast()`.
