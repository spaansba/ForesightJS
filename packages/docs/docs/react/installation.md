---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - React
  - "@foresightjs/react"
  - Installation
description: Install the official React bindings for ForesightJS
last_updated:
  date: 2026-06-10
  author: Bart Spaans
---

# Installation

[![npm version](https://img.shields.io/npm/v/@foresightjs/react.svg)](https://www.npmjs.com/package/@foresightjs/react)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/react.svg)](https://www.npmjs.com/package/@foresightjs/react)

`@foresightjs/react` is the official React package for ForesightJS. It gives you [`useForesight`](./useForesight.md), the [`Foresight` component](./foresight-component.md) and [`useForesightEvent`](./useForesightEvent.md) so you can register elements and read their prediction state straight from a component.

```bash
npm install @foresightjs/react js.foresight
# or
pnpm add @foresightjs/react js.foresight
# or
yarn add @foresightjs/react js.foresight
```

```tsx
import { useForesight, ForesightManager } from "@foresightjs/react"
```

Requires React 18 or 19 and `js.foresight` 4.2.2 or later within v4.

## Configuring the manager

You don't have to configure anything. The manager auto-initializes with sensible defaults the first time you register an element.

If you do want to tweak global behaviour, call `ForesightManager.initialize()` once at your app entry point. See [Initialize the Manager](./initialize-the-manager.md) and [Global Settings](./configuration/global-settings.md).

## Devtools

The visual [Development Tools](./devtools.md) live in their own package (`js.foresight-devtools`) and work the same regardless of framework.
