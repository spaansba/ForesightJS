---
"js.foresight": patch
---

Fix `reactivate()` activating elements on a limited connection or while detached from the DOM, and a double reactivation timer when an element reconnects mid-cooldown.
