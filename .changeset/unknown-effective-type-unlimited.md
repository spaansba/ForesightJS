---
"js.foresight": patch
---

Treat unknown `navigator.connection.effectiveType` values as unlimited instead of limited, so browsers reporting a new connection type (e.g. a future "5g") no longer silently disable all registered elements. Data saver still counts as limited.
