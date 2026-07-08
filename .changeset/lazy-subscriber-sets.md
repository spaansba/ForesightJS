---
"js.foresight": patch
---

Element state and bounds subscriber `Set`s are now created on first subscribe instead of eagerly at registration. Headless and plain-JS usage that registers elements but never subscribes to reactive state (the common case outside the framework wrappers) no longer allocates two empty `Set`s per element.
