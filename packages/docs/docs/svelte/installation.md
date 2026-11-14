---
description: Install the Svelte 5 bindings for ForesightJS
---

# Svelte

`@foresightjs/svelte` provides Svelte 5 bindings for the framework-agnostic `js.foresight` core. It works with Svelte and SvelteKit, including SSR.

```bash
pnpm add @foresightjs/svelte js.foresight
```

Requires Svelte 5 and `js.foresight` 4.3 or later within v4. Svelte 4 is not supported.

## Quick start

The action registers the element when it mounts, updates options when its parameter changes, and unregisters when it is destroyed:

```svelte
<script lang="ts">
  import { foresight } from "@foresightjs/svelte"

  let enabled = $state(true)
</script>

<button
  use:foresight={{
    enabled,
    callback: async () => {
      await fetch("/api/preview")
    },
  }}
>
  Preview
</button>
```

The manager initializes lazily with its defaults. To customize global settings, call `ForesightManager.initialize(settings)` once in a browser entry point before mounting your app, or `src/hooks.client.ts` in SvelteKit. The package re-exports the core manager and types. See [global settings](../configuration/global-settings.md).

## SSR

Importing the package and creating reactive registrations does not initialize the manager. Actions and effects run only in the browser, so server-rendered markup has an unregistered initial state until the action mounts. Keep direct calls to `ForesightManager.initialize` or `.instance` in browser lifecycle code. There is no need to disable SvelteKit SSR.

See the [API](./api.md) for reactive state and events, and the [SvelteKit guide](./sveltekit.md) for route preloading.
