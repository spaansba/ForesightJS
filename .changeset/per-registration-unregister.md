---
"js.foresight": minor
---

`unregister()` on a `register()` result now releases only that registration. An element registered more than once (for example by two components) stays tracked until every result has called `unregister()`, and a result can no longer unregister a later registration of the same element. `ForesightManager.instance.unregister(element)` still removes the element immediately.
