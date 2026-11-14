---
"@foresightjs/astro": patch
---

The integration only cleans up the anchors it registered itself. Elements registered by other code are no longer unregistered when they detach.
