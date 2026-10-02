# [ForesightJS](https://foresightjs.com/)

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![Bundle Size](https://img.shields.io/bundlejs/size/js.foresight)](https://bundlejs.com/?q=js.foresight)

[![GitHub stars](https://img.shields.io/github/stars/spaansba/ForesightJS.svg?style=social&label=Star)](https://github.com/spaansba/ForesightJS)
[![Best of JS](https://img.shields.io/endpoint?url=https://bestofjs-serverless.now.sh/api/project-badge?fullName=spaansba%2FForesightJS%26since=daily)](https://bestofjs.org/projects/foresightjs)

[![Demo](https://img.shields.io/badge/demo-live-blue)](https://foresightjs.com#playground)

ForesightJS is a lightweight JavaScript library that predicts user intent to prefetch content before it's needed. It works completely out of the box without configuration, supporting both desktop and mobile devices with different prediction strategies.

### [Playground](https://foresightjs.com/)

![](https://github.com/user-attachments/assets/f5650c63-4489-4878-bd72-d8954c6a739b)
_In the GIF above, the [ForesightJS DevTools](https://foresightjs.com/docs/debugging/devtools) are enabled. Normally, users won't see anything that ForesightJS does except the increased perceived speed from early prefetching._

## Quick start

```bash
pnpm add js.foresight
# or
npm install js.foresight
```

Add a link to your page:

```html
<a id="about-link" href="/about">About</a>
```

In a bundled client module, after the link is in the DOM:

```ts
import { ForesightManager } from "js.foresight"

const link = document.querySelector<HTMLAnchorElement>("#about-link")

if (link) {
  ForesightManager.instance.register({
    element: link,
    callback: async () => {
      await fetch("/about")
    },
  })
}
```

ForesightJS runs the callback when it predicts interaction with the link. Replace `fetch` with your router or data cache's prefetch function. Your app owns caching and navigation.

Keep the result of `register()` and call its `unregister()` method when removing the element.

### SSR and client initialization

Register DOM elements only in the browser, after they mount. The manager initializes automatically with defaults on first use.

For custom global settings, run this in your client entry before registering elements. Guard initialization in modules shared with the server:

```ts
import { ForesightManager } from "js.foresight"

if (typeof window !== "undefined") {
  ForesightManager.initialize({ defaultHitSlop: 20 })
}
```

`initialize()` uses settings only on its first call. Later changes go through `ForesightManager.instance.alterGlobalSettings()`.

## Integrations

Since ForesightJS is framework agnostic, it can be integrated with any JavaScript framework. There are official packages for React, Vue, Angular, and Astro:

- **JavaScript** → [`js.foresight`](https://foresightjs.com/docs/getting-started/quick-start): the framework-agnostic core, usable in any project.
- **React** → [`@foresightjs/react`](https://foresightjs.com/docs/react/installation): `useForesight`, the `Foresight` component, `useForesightEvent`, plus [Next.js](https://foresightjs.com/docs/react/nextjs) and [React Router](https://foresightjs.com/docs/react/react-router) examples.
- **Vue** → [`@foresightjs/vue`](https://foresightjs.com/docs/vue/quick-start): the `v-foresight` directive, the `Foresight` component, and the `useForesight` / `useForesightEvent` composables.
- **Angular** → [`@foresightjs/angular`](https://foresightjs.com/docs/angular/installation): the `[fsForesight]` directive, `ForesightService`, `ForesightComponent`, and `injectForesightEvent`.
- **Astro** → [`@foresightjs/astro`](https://foresightjs.com/docs/astro/installation): adds `foresight` as a fifth prefetch strategy next to Astro's native four, plus the `<ForesightLink>` component and `registerForesight` client API.

Using another framework (Svelte, Solid, etc.)? See [Other Frameworks](https://foresightjs.com/docs/other-frameworks) for how to build your own thin binding on top of the core. Sharing integrations for other frameworks/packages is highly appreciated!

## Prediction Strategies

ForesightJS uses different prediction strategies depending on the device type:

**Desktop/Keyboard Users**: Mouse trajectory prediction, keyboard navigation tracking, and scroll-based prefetching. [Read more](https://foresightjs.com/docs/getting-started/what-is-foresightjs#keyboardmouse-users)

**Mobile Devices**: Viewport enter detection and touch start events (configurable via [`touchDeviceStrategy`](https://foresightjs.com/docs/configuration/global-settings#touchdevicestrategy)). [Read more](https://foresightjs.com/docs/getting-started/what-is-foresightjs#touch-devices)

## Configuration

ForesightJS works out of the box with no setup required, but it can be configured both [globally](https://foresightjs.com/docs/configuration/global-settings) and per [element](https://foresightjs.com/docs/configuration/registration-options) if needed.

## Development Tools

ForesightJS has dedicated [Development Tools](https://github.com/spaansba/ForesightJS/tree/main/packages/js.foresight-devtools) created with [Foresight Events](https://foresightjs.com/docs/events) that help you understand and tune how foresight is working in your application. This standalone development package provides real-time visualization of mouse trajectory predictions, element bounds, and callback execution.

```bash
pnpm add js.foresight-devtools
```

See the [development tools documentation](https://foresightjs.com/docs/debugging/devtools) for more details.

# Contributing

Please see the [contributing guidelines](/CONTRIBUTING.md)
