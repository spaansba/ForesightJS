# @foresightjs/vue

[![npm version](https://img.shields.io/npm/v/@foresightjs/vue.svg)](https://www.npmjs.com/package/@foresightjs/vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Official Vue 3 bindings for [ForesightJS](https://foresightjs.com/), a lightweight library that predicts user intent (mouse trajectory, keyboard navigation, scroll, touch) to trigger callbacks like prefetching _before_ the user interacts.

- **Docs:** [foresightjs.com/docs/vue/installation](https://foresightjs.com/docs/vue/installation)
- **Core library:** [`js.foresight`](https://www.npmjs.com/package/js.foresight)
- **Playground:** [foresightjs.com](https://foresightjs.com/#playground)

## Installation

```bash
pnpm add @foresightjs/vue js.foresight
# or
npm install @foresightjs/vue js.foresight
```

Requires Vue 3.5+

## What's included

- `v-foresight` -> directive to register an element with a callback or full options object
- `useForesight` -> register a single element and get reactive refs for its state
- `useForesights` -> register a dynamic list of elements from a single composable
- `useForesightEvent` -> subscribe to a ForesightManager event for the lifetime of the calling scope

For usage and examples, see the [Vue documentation](https://foresightjs.com/docs/vue/installation).

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
