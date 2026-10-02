---
"js.foresight": patch
---

Fix handlers and predictors connecting after a lazy load that was superseded: a device switch (touch to mouse) or touch strategy change mid-load, a teardown mid-load, or a tab/scroll prediction setting turned off mid-load.
