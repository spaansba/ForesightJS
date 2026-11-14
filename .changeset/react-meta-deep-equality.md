---
"@foresightjs/react": patch
---

`meta` and `hitSlop` changes are detected by deep equality instead of JSON, so changes to circular `meta` values are applied.
