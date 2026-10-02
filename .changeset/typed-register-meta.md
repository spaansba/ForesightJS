---
"js.foresight": minor
"js.foresight-devtools": patch
"@foresightjs/vue": patch
"@foresightjs/angular": patch
---

Add `ForesightRegister` module augmentation to type metadata across registration options, callbacks, events, devtools, and framework bindings without generics. Export `ForesightMeta`, which preserves `Record<string, unknown>` when no metadata type is registered.
