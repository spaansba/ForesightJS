---
"js.foresight": patch
---

Drop 4 redundant `if (!this.isSetup)` guards around `initializeGlobalListeners()`. The method already self-guards on `isSetup`, so the outer checks were dead weight.
