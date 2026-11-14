---
"js.foresight": minor
"@foresightjs/react": minor
"@foresightjs/vue": minor
"@foresightjs/angular": minor
"js.foresight-devtools": patch
---

Callbacks receive a second argument with `hitType` and an `AbortSignal`. The signal aborts when the element is unregistered, disabled or removed from the DOM while the callback runs. A callback that rejects after the abort gets the new `"aborted"` status and can fire again.
