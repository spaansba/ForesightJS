---
description: Preload SvelteKit routes using the Svelte action
---

# SvelteKit

Install `@foresightjs/svelte` and `js.foresight`, then use SvelteKit's [`preloadData`](https://svelte.dev/docs/kit/$app-navigation#preloadData) in the callback. It loads both the route code and its `load` data without navigating. This Svelte 5 component is intended for internal, client-routed links:

```svelte title="src/lib/ForesightLink.svelte"
<script lang="ts">
  import type { Snippet } from "svelte"
  import { preloadData } from "$app/navigation"
  import { foresight } from "@foresightjs/svelte"

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
