---
"js.foresight": patch
---

`predictNextScrollPosition` now writes into a caller-owned `out` point instead of allocating a new one per call, matching `predictNextMousePosition`. `ScrollPredictor` reuses a single predicted-point object across the batch, removing the per-scroll-batch allocation.
