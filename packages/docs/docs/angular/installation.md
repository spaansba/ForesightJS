---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Angular
  - "@foresightjs/angular"
  - Installation
description: Install the official Angular bindings for ForesightJS
last_updated:
  date: 2026-06-26
  author: Bart Spaans
---

# Installation

[![npm version](https://img.shields.io/npm/v/@foresightjs/angular.svg)](https://www.npmjs.com/package/@foresightjs/angular)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/angular.svg)](https://www.npmjs.com/package/@foresightjs/angular)

`@foresightjs/angular` is the official Angular package for ForesightJS. It ships the standalone [`[fsForesight]`](./directive.md) directive for the common case, plus [`ForesightService`](./foresight-service.md), [`ForesightComponent`](./foresight-component.md), and [`injectForesightEvent`](./injectForesightEvent.md) for manual registration and event listeners.

```bash
npm install @foresightjs/angular js.foresight
# or
pnpm add @foresightjs/angular js.foresight
# or
yarn add @foresightjs/angular js.foresight
```

```ts
import { ForesightDirective, ForesightManager, ForesightService } from "@foresightjs/angular"
```

Requires Angular 17 or newer.

## Configuring the manager

You don't have to configure anything. The manager auto-initializes with sensible defaults the first time you register an element.

If you want to tweak global behavior, call `ForesightManager.initialize()` once in your `main.ts` before your app renders. See [Initialize the Manager](./initialize-the-manager.md) and [Global Settings](./configuration/global-settings.md).

## Devtools

The visual [Development Tools](./devtools.md) live in their own package (`js.foresight-devtools`) and work the same regardless of framework.
