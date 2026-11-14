---
"@foresightjs/angular": patch
---

Registration and event listeners are skipped during server rendering, so the directive and component no longer log errors under SSR. `@angular/common` is now a peer dependency.
