---
keywords:
  - ForesightJS
  - Angular
  - Svelte
  - SvelteKit
  - Solid
  - integration
  - subscribe
  - getSnapshot
description: Use ForesightJS in frameworks without an official package and build reactive bindings with the subscribe pattern
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

# Other Frameworks

There are official packages for [React](./react/installation.md), [Vue](./vue/installation.md), [Angular](./angular/installation.md), and [Astro](./astro/installation.md). For every other framework (Svelte, Solid, etc.) `js.foresight` has everything you need to build your own thin binding. This page shows the two pieces involved: registering from a component lifecycle, and the subscribe pattern for reactive state.

## Registering from a component

Register the element when your component mounts and unregister when it is destroyed. Detaching an element from the DOM does **not** unregister it (it is parked and resumes if it reattaches), so the cleanup call matters. A Svelte action is a good example of the shape:

```js
import { ForesightManager } from "js.foresight"

// <a use:foresight={{ callback: prefetch }} href="/about">About</a>
export function foresight(node, options) {
  const { unregister } = ForesightManager.instance.register({
    element: node,
    ...options,
  })

  return {
    destroy: () => unregister(),
  }
}
```

The options are the same [registration options](./configuration/registration-options.md) as everywhere else; `callback` is the only required field.

## Svelte and SvelteKit

### A typed action with reactive options

For a reusable TypeScript action, add an `update` handler as well as cleanup. `replaceElementOptions` applies the latest complete options, resetting omitted optional fields to their defaults (unlike `updateElementOptions`, which patches only the supplied fields).

```ts title="src/lib/foresight.ts"
import type { Action } from "svelte/action"
import { ForesightManager, type ForesightRegisterOptionsWithoutElement } from "js.foresight"

export const foresight: Action<HTMLElement, ForesightRegisterOptionsWithoutElement> = (
  node,
  options
) => {
  const manager = ForesightManager.instance
  const registration = manager.register({ ...options, element: node })

  return {
    update(nextOptions) {
      manager.replaceElementOptions(node, nextOptions)
    },
    destroy() {
      registration.unregister()
    },
  }
}
```

Svelte calls `update` when the action parameter changes, so callbacks and options such as `enabled` stay current. Actions run only in the browser, not during SSR: keep access to `ForesightManager.instance` inside the action rather than at module scope. Importing the library does not require disabling SvelteKit SSR.

### Preloading SvelteKit routes

Install `js.foresight`, then use SvelteKit's [`preloadData`](https://svelte.dev/docs/kit/$app-navigation#preloadData) in the callback. It loads both the route code and its `load` data without navigating. This Svelte 5 component is intended for internal, client-routed links:

```svelte title="src/lib/ForesightLink.svelte"
<script lang="ts">
  import type { Snippet } from "svelte"
  import { preloadData } from "$app/navigation"
  import { foresight } from "./foresight"

  let { href, children }: { href: string; children: Snippet } = $props()
</script>

{#key href}
  <a
    {href}
    use:foresight={{
      callback: async () => {
        await preloadData(href)
      },
    }}
    data-sveltekit-preload-data="false"
    data-sveltekit-preload-code="false"
  >
    {@render children()}
  </a>
{/key}
```

Use it like a normal internal link:

```svelte title="src/routes/+page.svelte"
<script lang="ts">
  import ForesightLink from "../lib/ForesightLink.svelte"

  let href = $state("/about")
</script>

<ForesightLink {href}>About</ForesightLink>
```

Pass the same resolved URL you would use in a normal `href`, including your app's base path when applicable. Keep external URLs, downloads, and links that require a full page reload as normal anchors without this action.

The `{#key href}` block destroys the old anchor and unregisters it when the destination changes. The new anchor gets a fresh prediction state. Updating the callback alone does **not** reset `isPredicted`; by default a registration fires only once (`reactivateAfter: Infinity`), which matters for reused links in lists or persistent layouts.

SvelteKit's default template enables hover data preloading on the `<body>`. The two `"false"` attributes override inherited [automatic preload settings](https://svelte.dev/docs/kit/link-options) for this link, leaving Foresight in control of when to start the programmatic preload. You can omit them to keep SvelteKit's automatic triggers as well. They do not disable explicit calls to `preloadData`, and the anchor still uses SvelteKit's normal click navigation.

If you only want to import route code without running `load`, use [`preloadCode`](https://svelte.dev/docs/kit/$app-navigation#preloadCode) instead. Check the argument expected by your SvelteKit version: SvelteKit 2 accepts a pathname, while SvelteKit 3 accepts a route ID. Preloading data can run server requests before a click, so choose code-only preloading when speculative data loading is unsuitable.

## The subscribe pattern

:::tip Most of the time you don't need this
If you only want to fire a callback (prefetching, preloading, etc.), the registration snippet above is all you need and you can skip this entire section. The subscribe pattern only matters when you want to drive reactive state from a registration, which is mainly something full framework adapters do (like our official [React](./react/installation.md), [Vue](./vue/installation.md), and [Angular](./angular/installation.md) packages).
:::

`register()` returns more than the unregister function: the element's full [state snapshot](./configuration/registration-options.md#registration-return-value) plus `subscribe` and `getSnapshot`. The state is an immutable snapshot whose reference is replaced (never mutated) on every logical change, which makes it plug into any reactivity system:

```js
const reg = ForesightManager.instance.register({
  element,
  callback: () => prefetch("/about"),
})

const unsubscribe = reg.subscribe(() => {
  const state = reg.getSnapshot()
  element.classList.toggle("predicted", state.isPredicted)
})

// when the component is destroyed
unsubscribe()
reg.unregister()
```

`subscribe(listener)` calls your listener on every logical state change and returns an unsubscribe function. `getSnapshot()` returns the current snapshot; because the reference only changes when the state changes, equality checks are enough to know whether to re-render.

This is exactly how the official packages are built:

- **React** feeds the pair straight into `useSyncExternalStore(reg.subscribe, reg.getSnapshot)`.
- **Vue** copies snapshot fields into a reactive object inside `subscribe` and exposes them as readonly refs.
- **Angular** stores the snapshot in a signal and updates it inside `subscribe`.
- **Svelte (runes)** is the same idea: keep the snapshot in `$state.raw` and reassign it inside `subscribe`.
- **Solid** can wrap it with `from(set => reg.subscribe(() => set(reg.getSnapshot())))`.

If you build a binding for your framework, sharing it is highly appreciated!
