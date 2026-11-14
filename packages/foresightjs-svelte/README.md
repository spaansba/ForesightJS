# @foresightjs/svelte

Svelte 5 bindings for [ForesightJS](https://foresightjs.com/). Predict user intent and trigger prefetching before an interaction.

```bash
pnpm add @foresightjs/svelte js.foresight
```

Requires Svelte 5 and `js.foresight` ^4.3.0. Works with SvelteKit SSR.

## Action

```svelte
<script lang="ts">
  import { foresight } from "@foresightjs/svelte"
</script>

<button use:foresight={{ callback: () => console.log("Predicted") }}>Preview</button>
```

`use:foresight` registers on mount, replaces options on parameter updates, and unregisters on destruction. It accepts the core registration options without `element`.

## Reactive state

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
<p>Predicted: {target.state.isPredicted}</p>
```

Pass a getter for reactive options. Read `target.state` through the result to retain reactivity; destructuring it captures a single snapshot. Bind each result to one element at a time. Subscriptions and registrations are cleaned up on destruction.

`onForesightEvent(type, listener)` subscribes to typed manager events during component initialization and cleans up automatically. The core manager and types are re-exported.

Imports and `createForesight` are SSR-safe; manager access happens in browser actions/effects. Initialize custom global settings in a browser entry point before mount or SvelteKit's `src/hooks.client.ts`. Options replace in place without resetting prediction state; key links by destination for fresh state when `href` changes.

- [Installation and SSR](https://foresightjs.com/docs/svelte/installation)
- [API](https://foresightjs.com/docs/svelte/api)
- [SvelteKit route preloading](https://foresightjs.com/docs/svelte/sveltekit)
- Local demo: `pnpm dev`, choose the framework devpage, then select **Svelte**.

The package preserves `.svelte.js` runes for the consuming Svelte compiler and ships TypeScript declarations. It has no SvelteKit runtime dependency.
