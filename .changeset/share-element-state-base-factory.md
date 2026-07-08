---
"js.foresight": patch
---

Share a base factory between `createElementInternal` and `createUnregisteredSnapshot` so the full `ForesightElementState` field list is only written once, preventing the snapshot from silently drifting when a field is added.
