---
"js.foresight": patch
---

Derive `ForesightEvent` from `keyof ForesightEventMap` instead of hand-duplicating the event names, so adding an event to the map no longer requires updating the union in lockstep.
