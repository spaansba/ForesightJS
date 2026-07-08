---
"js.foresight": patch
---

The mouse trajectory scan now iterates a precomputed set of scannable elements (on-screen, active, not yet predicted) instead of walking the full registry and re-checking those flags every pointer move. Membership is kept in sync on registration, state changes, and unregistration. Cost now scales with the number of visible elements rather than the total registered, so pages with many registered but few on-screen elements run the per-frame scan dramatically faster with no change at small element counts.
