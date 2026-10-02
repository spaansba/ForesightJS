---
"js.foresight": patch
"@foresightjs/react": patch
"@foresightjs/vue": patch
"@foresightjs/angular": patch
---

Add `ForesightManager.replaceElementOptions`, which resets omitted options to their defaults. The framework integrations now use it, so removing a prop (e.g. `enabled={false}` to no `enabled`) resets that option instead of keeping its old value.
