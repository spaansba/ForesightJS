---
keywords:
  - ForesightJS
  - migration
  - upgrade
  - v3
  - v4
  - React
  - Vue
  - "@foresightjs/react"
  - "@foresightjs/vue"
description: Moving from the v3 copy-paste integrations to the official v4 React and Vue packages
last_updated:
  date: 2026-06-09
  author: Bart Spaans
---

import MigratingCore from './\_partials/\_migrating-core.mdx';

# Migrating to v4

The goal of v4 is to make ForesightJS easier to set up. In v3 there was no React or Vue package - the docs handed you a hook, composable and directive to copy into your own project. v4 replaces that with official wrapper packages: [`@foresightjs/react`](./react/installation.md) and [`@foresightjs/vue`](./vue/installation.md). Install one, delete your copied files, and update a couple of names.

The breaking changes in core `js.foresight` exist to support these wrappers: frameworks like React and Vue need immutable state snapshots and a subscription model to render reactively, so the core's element data was reworked into exactly that. These changes affect you even if you don't use the wrapper packages - see [Core](#core) below.

Angular has no official package yet; the copy-paste directive from the [3.5 docs](/docs/3.5/angular) still works.

## Core

<MigratingCore />

## React and Vue

Using one of the wrapper packages? Switch framework with the dropdown at the top of the sidebar to get the package migration guide: [React](./react/migrating-to-v4.md) or [Vue](./vue/migrating-to-v4.md).
