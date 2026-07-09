---
"js.foresight-devtools": patch
---

Show overlays for elements that were registered before the devtools first rendered (for example when devtools is lazy-loaded). The initial element sync now runs in `firstUpdated`, once the overlay container exists.
