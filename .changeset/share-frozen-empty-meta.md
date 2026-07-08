---
"js.foresight": patch
---

Share a single frozen empty `meta` object across element states instead of allocating a fresh `{}` per element. The state snapshot is immutable and `meta` is never mutated in place, so registered elements without a `meta` and unregistered snapshots now reuse one object.
