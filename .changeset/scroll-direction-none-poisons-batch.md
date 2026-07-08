---
"js.foresight": patch
---

`ScrollPredictor` no longer caches a `"none"` scroll direction for the whole `handlePositionChange` batch. A non-moving element (e.g. `position:fixed`) returning `"none"` used to poison the cached direction and silently disable scroll prefetch for every later element that actually moved. The direction is now only locked in once a real direction is found.
