# [ForesightJS](https://foresightjs.com/)

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/js.foresight)](https://bundlephobia.com/package/js.foresight)
[![GitHub last commit](https://img.shields.io/github/last-commit/spaansba/ForesightJS)](https://github.com/spaansba/ForesightJS/commits)

[![GitHub stars](https://img.shields.io/github/stars/spaansba/ForesightJS.svg?style=social&label=Star)](https://github.com/spaansba/ForesightJS)
[![Best of JS](https://img.shields.io/endpoint?url=https://bestofjs-serverless.now.sh/api/project-badge?fullName=spaansba%2FForesightJS%26since=daily)](https://bestofjs.org/projects/foresightjs)

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/demo-live-blue)](https://foresightjs.com#playground)

ForesightJS is a lightweight JavaScript library that predicts user intent to prefetch content before it's needed. **It works completely out of the box without configuration**, supporting both desktop and mobile devices with different prediction strategies.

### [Playground](https://foresightjs.com/)

![](https://github.com/user-attachments/assets/f5650c63-4489-4878-bd72-d8954c6a739b)
_In the GIF above, the [ForesightJS DevTools](https://foresightjs.com/docs/debugging/devtools) are enabled. Normally, users won't see anything that ForesightJS does except the increased perceived speed from early prefetching._

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. There are official packages for React and Vue:

- **JavaScript** → [`js.foresight`](https://foresightjs.com/docs/getting-started/quick-start): the framework-agnostic core, usable in any project.
- **React** → [`@foresightjs/react`](https://foresightjs.com/docs/react/installation): `useForesight`, the `Foresight` component, `useForesightEvent`, plus [Next.js](https://foresightjs.com/docs/react/nextjs) and [React Router](https://foresightjs.com/docs/react/react-router) examples.
- **Vue** → [`@foresightjs/vue`](https://foresightjs.com/docs/vue/installation): the `v-foresight` directive and the `useForesight` / `useForesights` / `useForesightEvent` composables.

> **Note:** The `@foresightjs/react` and `@foresightjs/vue` packages are in beta and not yet stable. They work and are fully tested, but the API may still change.

Using another framework (Angular, Svelte, Solid, …)? See [Other Frameworks](https://foresightjs.com/docs/other-frameworks) for how to build your own thin binding on top of the core. Sharing integrations for other frameworks/packages is highly appreciated!

## Configuration

ForesightJS works out of the box with no setup required, but it can be configured both [globally](https://foresightjs.com/docs/configuration/global-settings) and per [element](https://foresightjs.com/docs/configuration/registration-options) if needed.

## Prediction Strategies

ForesightJS uses different prediction strategies depending on the device type:

**Desktop/Keyboard Users**: Mouse trajectory prediction, keyboard navigation tracking, and scroll-based prefetching. [Read more](https://foresightjs.com/docs/getting-started/what-is-foresightjs#keyboardmouse-users)

**Mobile Devices**: Viewport enter detection and touch start events (configurable via [`touchDeviceStrategy`]). [Read more](https://foresightjs.com/docs/getting-started/what-is-foresightjs#touch-devices-v330)

## Development Tools

ForesightJS has dedicated [Development Tools](https://github.com/spaansba/ForesightJS/tree/main/packages/js.foresight-devtools) created with [Foresight Events](https://foresightjs.com/docs/events) that help you understand and tune how foresight is working in your application. This standalone development package provides real-time visualization of mouse trajectory predictions, element bounds, and callback execution.

```bash
pnpm add js.foresight-devtools
```

See the [development tools documentation](https://foresightjs.com/docs/debugging/devtools) for more details.

## Providing Context to AI Tools

ForesightJS is a newer library, so most AI assistants and LLMs may not have much built-in knowledge about it. To improve their responses, you can provide the following context:

- Use [llms.txt](https://foresightjs.com/llms.txt) for a concise overview of the API and usage patterns.
- Use [llms-full.txt](https://foresightjs.com/llms-full.txt) for a full markdown version of the docs, ideal for AI tools that support context injection or uploads.
- All documentation pages are also available in markdown. You can view them by adding .md to the end of any URL, for example: [https://foresightjs.com/docs/getting-started/what-is-foresightjs.md](https://foresightjs.com/docs/getting-started/what-is-foresightjs.md).

[Read more](https://foresightjs.com/docs/ai-context)

# Contributing

Please see the [contributing guidelines](/CONTRIBUTING.md)
