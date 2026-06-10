---
keywords:
  - ForesightJS
  - migration
  - v4
  - React
  - "@foresightjs/react"
description: Moving from the v3 copy-paste React hook to the official @foresightjs/react package
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import MigratingCore from '../\_partials/\_migrating-core.mdx';

# Migrating to v4

In v3 there was no React package - the docs handed you a `useForesight` hook to copy into your own project. v4 replaces that with the official [`@foresightjs/react`](./installation.md) package. Install it, delete your copied file, and update a couple of names.

Install the package and delete your hand-rolled `useForesight.ts`:

```bash
npm install @foresightjs/react
```

Then update the import and the return shape:

```diff
- import useForesight from "./hooks/useForesight"
+ import { useForesight } from "@foresightjs/react"

- const { elementRef, registerResults } = useForesight({ callback, name })
+ const { elementRef, isRegistered, isPredicted } = useForesight({ callback, name })
```

What changed:

- **The state is flattened onto the return value.** There's no `registerResults` object anymore. `registerResults.isRegistered` becomes `isRegistered`, and you also get the rest of the reactive state (`isPredicted`, `isActive`, `hitCount`, …) which re-renders when it changes. See [useForesight](./useForesight.md#reactive-state).
- **`elementRef` is now a callback ref.** You still attach it the same way (`ref={elementRef}`), so your JSX doesn't change.
- **`registerResults.isTouchDevice` is gone.** Touch devices are handled internally by the configured [`touchDeviceStrategy`](./configuration/global-settings.md#touch-device-settings), so the manual fallback branch is no longer needed.

## Core changes

The core `js.foresight` library also has a few breaking changes. The package handles most of these for you, but they matter if you call `register()` or listen to events directly.

<MigratingCore />
