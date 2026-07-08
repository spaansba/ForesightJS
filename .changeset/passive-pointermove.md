---
"js.foresight": patch
---

Register the global `pointermove` listener as passive, letting the browser dispatch high-frequency pointer events without treating them as cancelable. Reduces main-thread scheduling pressure during fast mouse movement and scrolling.
