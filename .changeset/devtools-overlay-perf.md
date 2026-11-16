---
"js.foresight-devtools": patch
---

Faster devtools with many elements: the elements tab only renders visible rows (10,000 elements went from over a million DOM nodes to under 50,000), page overlays no longer write to the DOM while scrolling or force a layout per element, animations are compositor-only, and hidden overlays no longer process updates
