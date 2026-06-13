# Packages

This directory contains all packages in the ForesightJS monorepo.

## Core Packages

### [js.foresight](./js.foresight/)

The core ForesightJS library. A lightweight JavaScript/TypeScript library that predicts user intent based on mouse movements, scroll behavior, and keyboard navigation.

**Published as:** `js.foresight` on npm

### [js.foresight-devtools](./js.foresight-devtools/)

Visual development tools for ForesightJS. Provides an overlay system with trajectory visualization, element bounds, and runtime controls for tuning prediction parameters.

**Published as:** `js.foresight-devtools` on npm

## Framework Packages

> These packages are at `0.1.0` and not yet stable. They work and are fully tested, but their APIs may still change.

### [foresightjs-react](./foresightjs-react/)

Official React bindings: the `useForesight` and `useForesightEvent` hooks plus the `Foresight` component. Registers elements with the `ForesightManager` from React components and exposes their reactive prediction state.

**Published as:** `@foresightjs/react` on npm

### [foresightjs-vue](./foresightjs-vue/)

Official Vue 3 bindings: the `v-foresight` directive, the `useForesight` and `useForesightEvent` composables plus the `Foresight` component.

**Published as:** `@foresightjs/vue` on npm

## Development Packages

### [devpage-framework](./devpage-framework/) · [devpage-nextjs](./devpage-nextjs/)

Development environments for testing and debugging ForesightJS against each framework. Used by maintainers for live testing with immediate feedback. `devpage-framework` runs the React and Vue demos on a single page, sharing one `ForesightManager` singleton — toggle between them with one click.

### [docs](./docs/)

Docusaurus documentation site for ForesightJS. Contains comprehensive guides, API documentation, and interactive examples.

**Live at:** [foresightjs.com](https://foresightjs.com)
