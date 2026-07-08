---
"js.foresight": patch
---

Fix lazy predictor connects leaking global listeners when a handler disconnects mid-import. `DesktopHandler.connectTabPredictor`/`connectScrollPredictor` and `TouchDeviceHandler.setTouchPredictor` now re-check `isConnected` after the dynamic `import()` resolves, so a predictor whose handler disconnected during loading no longer attaches `keydown`/`focusin`/`pointerdown` listeners that never get aborted.
