---
"js.foresight": patch
---

Fix an element unregistered while its callback runs getting its `data-*` attributes back, and the late completion unobserving or reactivating a later re-registration of the same element.
