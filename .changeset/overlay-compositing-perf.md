---
"js.foresight-devtools": patch
---

Element overlays no longer force a compositor layer per overlay (`will-change: transform`) and name labels no longer use `backdrop-filter: blur`. On pages with many visible elements this kept hundreds of GPU layers alive and re-sampled a blur every frame, saturating the compositor and making the mouse trajectory line visibly lag behind the cursor. Labels now use a more opaque background so they stay readable without the blur.
