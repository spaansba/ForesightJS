---
keywords:
  - ForesightJS
  - Angular
  - Svelte
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
- **Vue** stores the snapshot in a `shallowRef` and replaces it inside `subscribe`.
- **Angular** stores the snapshot in a signal and updates it inside `subscribe`.
- **Svelte (runes)** is the same idea: keep the snapshot in `$state.raw` and reassign it inside `subscribe`.
- **Solid** can wrap it with `from(set => reg.subscribe(() => set(reg.getSnapshot())))`.

If you build a binding for your framework, sharing it is highly appreciated!
