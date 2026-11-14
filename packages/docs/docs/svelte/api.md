---
description: Svelte actions, reactive registration state, and manager events
---

# Svelte API

## `foresight`

```svelte
<script lang="ts">
  import { foresight } from "@foresightjs/svelte"
</script>

<a href="/about" use:foresight={{ callback: () => console.log("Predicted") }}>About</a>
```

The action accepts the core [registration options](../configuration/registration-options.md) without `element`. `callback` is required. Changed parameters replace the complete option set: omitted optional fields reset to their defaults. The element stays registered during updates. Changing the callback alone does not reset prediction state or callback history.

Use `createForesight` when you need reactive state. Both APIs clean up registrations on element destruction; detaching an element alone only parks it in the manager.

## `createForesight`

Call `createForesight` during component initialization. Pass a getter so Svelte can track changes to options, then bind the returned action to one element at a time:

```svelte
<script lang="ts">
  import { createForesight } from "@foresightjs/svelte"

  let enabled = $state(true)
  const target = createForesight(() => ({
    enabled,
    callback: async () => {
      await fetch("/api/preview")
    },
  }))
  const { action } = target
</script>

<button use:action aria-busy={target.state.isCallbackRunning}>Preview</button>
<p>{target.state.isPredicted ? "Predicted" : "Waiting"}</p>
```

`target.state` is a readonly [state snapshot](../configuration/registration-options.md#registration-return-value). It is stored in `$state.raw` and replaced on logical changes. Read it through `target.state` (or a `$derived` expression); destructuring `state` once captures only that snapshot. Geometry-only updates do not cause rerenders.

The action subscribes after registering, tracks the options getter in an effect, and unsubscribes before unregistering. It resets the snapshot when destroyed. A result can be rebound after destruction, but binding it to multiple elements simultaneously throws an error. Create a separate result per element, usually inside a child component for each list item.

Changing the callback alone does not reactivate an already predicted element. To repeat callbacks, set `reactivateAfter` or call the core manager's `reactivate`. When a link's destination changes, use a keyed block to create a fresh registration as shown in the [SvelteKit guide](./sveltekit.md).

## `onForesightEvent`

Call during component initialization to subscribe to a typed manager event for the component's lifetime. The effect does not run during SSR and aborts its subscription when destroyed:

```svelte
<script lang="ts">
  import { onForesightEvent } from "@foresightjs/svelte"

  let completed = $state(0)
  onForesightEvent("callbackCompleted", () => {
    completed += 1
  })
</script>

<p>Completed callbacks: {completed}</p>
```

The event type is fixed for that subscription. The callback can read current component state. See [events](../events.md) for event payloads and the core API.
