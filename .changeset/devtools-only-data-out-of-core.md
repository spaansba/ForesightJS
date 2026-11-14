---
"js.foresight": major
"js.foresight-devtools": patch
"@foresightjs/react": patch
"@foresightjs/vue": patch
"@foresightjs/angular": patch
---

Removed bookkeeping that only the devtools used. `getManagerData` no longer returns `globalCallbackHits`, `eventListeners`, `activeElementCount`, `parkedElementCount` or `loadedModules`. `registerCount` is removed from `ForesightElementState`, and the `CallbackHits` and `ForesightModules` types are no longer exported. To count callback hits yourself, listen to `callbackInvoked` and read `hitType`. The devtools now count hits on their own.
