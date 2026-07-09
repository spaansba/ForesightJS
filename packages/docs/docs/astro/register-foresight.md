---
sidebar_position: 5
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - registerForesight
  - client API
  - "@foresightjs/astro"
description: Register elements with custom callbacks from Astro script tags using registerForesight
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

# registerForesight

The integration only handles link prefetching. For everything else (custom callbacks, non-link elements, `meta`) use `registerForesight` from the client entry point inside a `<script>` tag:

```html
<button id="load-more">Load more</button>

<script>
  import { registerForesight } from "@foresightjs/astro/client"

  registerForesight("#load-more", {
    hitSlop: 40,
    meta: { section: "feed" },
    callback: () => fetchNextPage(),
  })
</script>
```

It is a thin wrapper over `ForesightManager.instance.register` that accepts a CSS selector or an element:

```ts
registerForesight(target: string | Element, options: ForesightRegisterOptionsWithoutElement): ForesightRegisterResult[]
```

A selector registers every matching element with the same options. The options are the regular [registration options](./configuration/registration-options.md), `callback` is the only required field. Each returned [`ForesightRegisterResult`](./configuration/registration-options.md#registration-return-value) contains the element's state snapshot plus `unregister`, `subscribe`, and `getSnapshot`.

:::note
Elements registered this way are not managed by the integration, so unlike links they are not automatically re-registered after view transitions. Re-run your script on `astro:page-load` if the element is part of a page that gets swapped.
:::
