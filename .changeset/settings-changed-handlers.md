---
"js.foresight": patch
---

Refactor settings dispatch so each handler reacts to its own setting changes via `onSettingsChanged`, instead of the manager reaching into handler internals.
