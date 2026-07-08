---
"js.foresight": patch
---

Skip building the `callbackInvoked` and `callbackCompleted` event payloads when no one is subscribed. Both emits now sit behind a `hasListeners` guard, avoiding a per-callback object allocation and, for `callbackCompleted`, the `activeElementCount` scan that fed its `wasLastActiveElement` field.
