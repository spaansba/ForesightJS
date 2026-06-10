---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Vue
  - Vue.js
  - "@foresightjs/vue"
  - Installation
description: Install the official Vue bindings for ForesightJS
last_updated:
  date: 2026-06-08
  author: Bart Spaans
---

# Installation

`@foresightjs/vue` is the official Vue 3 package for ForesightJS. It ships the [`v-foresight`](./directive.md) directive for the common case, plus the [`useForesight`](./useForesight.md), [`useForesights`](./useForesights.md) and [`useForesightEvent`](./useForesightEvent.md) composables when you want the element's prediction state.

```bash
npm install @foresightjs/vue
# or
pnpm add @foresightjs/vue
# or
yarn add @foresightjs/vue
```

That's it. Everything you need, including `ForesightManager` and all types, comes from `@foresightjs/vue` — there's nothing else to install:

```ts
import { useForesight, vForesight, ForesightManager } from "@foresightjs/vue"
```

## Configuring the manager

You don't have to configure anything. The manager auto-initializes with sensible defaults the first time you register an element.

If you want to tweak global behaviour, call `ForesightManager.initialize()` once in your `main.ts`. See [Initialize the Manager](./initialize-the-manager.md) and [Global Settings](./configuration/global-settings.md).

## Devtools

The visual [Development Tools](./devtools.md) live in their own package (`js.foresight-devtools`) and work the same regardless of framework.
