---
"js.foresight": patch
---

`applySettingsChanges` now returns just the changed-settings array instead of that array plus six hand-wired side-effect booleans. `alterGlobalSettings` derives a `Set` of changed keys and checks `changed.has(...)`, so adding a setting no longer means keeping a parallel flag struct in sync in three places.
