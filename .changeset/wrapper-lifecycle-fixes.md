---
"@foresightjs/react": patch
"@foresightjs/vue": patch
"@foresightjs/astro": patch
"@foresightjs/angular": patch
---

Fix wrapper lifecycle bugs found by testing against the real manager.

- React: `meta` and `hitSlop` changes are detected by deep equality, so functions and circular values inside `meta` are no longer ignored
- Vue: refs to multi-root or empty components no longer crash registration
- Astro: only anchors registered by the integration are cleaned up, and links added after a view transition are registered again
- Angular: registration and event listeners are skipped during server rendering. `@angular/common` is now a peer dependency
