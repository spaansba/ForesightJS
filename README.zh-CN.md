# [ForesightJS](https://foresightjs.com/)

[English](README.md) | **简体中文**

[![npm version](https://img.shields.io/npm/v/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![npm downloads](https://img.shields.io/npm/dt/js.foresight.svg)](https://www.npmjs.com/package/js.foresight)
[![Bundle Size](https://img.shields.io/bundlejs/size/js.foresight)](https://bundlejs.com/?q=js.foresight)

[![GitHub stars](https://img.shields.io/github/stars/spaansba/ForesightJS.svg?style=social&label=Star)](https://github.com/spaansba/ForesightJS)
[![Best of JS](https://img.shields.io/endpoint?url=https://bestofjs-serverless.now.sh/api/project-badge?fullName=spaansba%2FForesightJS%26since=daily)](https://bestofjs.org/projects/foresightjs)

[![Demo](https://img.shields.io/badge/demo-live-blue)](https://foresightjs.com#playground)

ForesightJS 是一个轻量级的 JavaScript 库，通过预测用户意图，在内容被需要之前就进行预取。它比悬停（hover）预取启动得更早，比视口（viewport）预取加载得更少，并且对键盘用户同样有效。它无需任何配置即可开箱即用，同时为桌面端和移动端提供不同的预测策略。

### [Playground](https://foresightjs.com/)

![](https://github.com/user-attachments/assets/f5650c63-4489-4878-bd72-d8954c6a739b)
_在上面的 GIF 中，[ForesightJS DevTools](https://foresightjs.com/docs/debugging/devtools) 处于开启状态。通常情况下，用户看不到 ForesightJS 的任何行为，只能感受到预取带来的更快的感知速度。_

## 集成

由于 ForesightJS 与框架无关，它可以集成到任何 JavaScript 框架中。官方提供了 React、Vue、Angular 和 Astro 的包：

- **JavaScript** → [`js.foresight`](https://foresightjs.com/docs/getting-started/quick-start)：与框架无关的核心包，可在任何项目中使用。
- **React** → [`@foresightjs/react`](https://foresightjs.com/docs/react/installation)：`useForesight`、`Foresight` 组件、`useForesightEvent`，以及 [Next.js](https://foresightjs.com/docs/react/nextjs) 和 [React Router](https://foresightjs.com/docs/react/react-router) 示例。
- **Vue** → [`@foresightjs/vue`](https://foresightjs.com/docs/vue/quick-start)：`v-foresight` 指令、`Foresight` 组件，以及 `useForesight` / `useForesightEvent` 组合式函数。
- **Angular** → [`@foresightjs/angular`](https://foresightjs.com/docs/angular/installation)：`[fsForesight]` 指令、`ForesightService`、`ForesightComponent` 和 `injectForesightEvent`。
- **Astro** → [`@foresightjs/astro`](https://foresightjs.com/docs/astro/installation)：在 Astro 原生的四种预取策略之外新增 `foresight` 作为第五种策略，并提供 `<ForesightLink>` 组件和 `registerForesight` 客户端 API。

使用其他框架（Svelte、Solid 等）？请参阅[其他框架](https://foresightjs.com/docs/other-frameworks)，了解如何在核心包之上构建你自己的轻量绑定。分享其他框架/包的集成非常受欢迎！

## 预测策略

ForesightJS 根据设备类型采用不同的预测策略：

**桌面端/键盘用户**：鼠标轨迹预测、键盘导航跟踪，以及基于滚动的预取。[了解更多](https://foresightjs.com/docs/getting-started/what-is-foresightjs#keyboardmouse-users)

**移动设备**：视口进入检测和触摸开始事件（可通过 [`touchDeviceStrategy`](https://foresightjs.com/docs/configuration/global-settings#touchdevicestrategy) 配置）。[了解更多](https://foresightjs.com/docs/getting-started/what-is-foresightjs#touch-devices)

## 配置

ForesightJS 无需任何设置即可开箱即用，但如果需要，也可以进行[全局](https://foresightjs.com/docs/configuration/global-settings)配置和按[元素](https://foresightjs.com/docs/configuration/registration-options)配置。

## 开发工具

ForesightJS 提供专门的[开发工具](https://github.com/spaansba/ForesightJS/tree/main/packages/js.foresight-devtools)，基于 [Foresight 事件](https://foresightjs.com/docs/events)构建，帮助你理解并调优 foresight 在你的应用中的工作方式。这个独立的开发包可以实时可视化鼠标轨迹预测、元素边界和回调执行情况。

```bash
pnpm add js.foresight-devtools
```

更多详情请参阅[开发工具文档](https://foresightjs.com/docs/debugging/devtools)。

# 贡献

请参阅[贡献指南](/CONTRIBUTING.md)
