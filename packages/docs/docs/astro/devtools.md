---
keywords:
  - ForesightJS
  - JS.Foresight
  - Astro
  - ForesightDevtools
  - js.foresight-devtools
  - Debugger
description: Use the ForesightJS development tools in an Astro app
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

import Devtools from "../\_partials/\_devtools.mdx"

# Development Tools

In Astro the easiest way to enable the devtools is the integration's [`devtools`](./integration.md#devtools) option, which loads them automatically during `astro dev` and keeps them out of production builds:

```js
// astro.config.mjs
foresight({
  devtools: true,
})
```

You still need to install the `js.foresight-devtools` package yourself (see below). If you want to customize the devtools options, skip the integration option and initialize them from a `<script>` tag instead.

<Devtools />
