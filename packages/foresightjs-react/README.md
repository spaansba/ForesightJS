# @foresightjs/react

[![npm version](https://img.shields.io/npm/v/@foresightjs/react.svg)](https://www.npmjs.com/package/@foresightjs/react)
[![npm downloads](https://img.shields.io/npm/dt/@foresightjs/react.svg)](https://www.npmjs.com/package/@foresightjs/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Official React bindings for [ForesightJS](https://foresightjs.com/), a lightweight library that predicts user intent (mouse trajectory, keyboard navigation, scroll, touch) to trigger callbacks like prefetching _before_ the user interacts.

- **Docs:** [foresightjs.com/docs/react/installation](https://foresightjs.com/docs/react/installation)
- **Core library:** [`js.foresight`](https://www.npmjs.com/package/js.foresight)
- **Playground:** [foresightjs.com](https://foresightjs.com/#playground)

## Installation

```bash
pnpm add @foresightjs/react js.foresight
# or
npm install @foresightjs/react js.foresight
```

Requires React 18+

## What's included

- `useForesight` -> register a single element and get its live state plus a callback ref to bind it
- `Foresight` -> component form of useForesight with a render prop, for dynamic lists or wherever the hook is awkward
- `useForesightEvent` -> subscribe to a ForesightManager event for the lifetime of the component

For usage and examples, see the [React documentation](https://foresightjs.com/docs/react/installation), including guides for [Next.js](https://foresightjs.com/docs/react/nextjs) and [React Router](https://foresightjs.com/docs/react/react-router).

## Contributing

Please see the [contributing guidelines](https://github.com/spaansba/ForesightJS/blob/main/CONTRIBUTING.md).

## License

[MIT](./LICENSE)
