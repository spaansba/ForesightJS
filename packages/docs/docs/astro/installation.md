---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Astro
  - "@foresightjs/astro"
  - Installation
description: Install the official Astro integration for ForesightJS
last_updated:
  date: 2026-07-09
  author: Bart Spaans
---

# Installation

[![npm version](https://img.shields.io/npm/v/@foresightjs/astro.svg)](https://www.npmjs.com/package/@foresightjs/astro)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/astro.svg)](https://www.npmjs.com/package/@foresightjs/astro)

`@foresightjs/astro` is the official Astro integration for ForesightJS. Unlike the React, Vue, and Angular packages it is not a set of component bindings: you add [`foresight()`](./integration.md) to your Astro config once and it registers your links automatically, prefetching them through Astro's own prefetch pipeline when intent is predicted.

```bash
npm install @foresightjs/astro js.foresight
# or
pnpm add @foresightjs/astro js.foresight
# or
yarn add @foresightjs/astro js.foresight
```

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
import foresight from "@foresightjs/astro"

export default defineConfig({
  integrations: [foresight()],
})
```

Requires Astro 5 or newer.

## Configuring the manager

You don't have to configure anything. The manager auto-initializes with sensible defaults when the first page loads.

If you want to tweak global behavior, pass a `manager` object to the integration. See [Initialize the Manager](./initialize-the-manager.md) and [Global Settings](./configuration/global-settings.md).

## Devtools

The visual [Development Tools](./devtools.md) live in their own package (`js.foresight-devtools`). Install it and set `devtools: true` on the integration to load them automatically during `astro dev`.
