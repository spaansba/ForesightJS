---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Angular
description: Integration details to add ForesightJS to your Angular projects
last_updated:
  date: 2025-07-04
  author: Akshay Khade
---

# Angular

```bash
npm i ngx-foresight
```

After that import the `ForesightjsDirective` to the components with `href` and `routerLink`, and use the `ForesightjsStrategy` as `preloadingStrategy` in the router's configuration. For example:

```ts
import { ForesightManager } from 'js.foresight';
import { ForesightDebugger } from 'js.foresight-devtools';
import { ForesightjsDirective } from 'ngx-foresight';

ForesightManager.initialize({
  enableMousePrediction: true,
  positionHistorySize: 8,
  trajectoryPredictionTime: 80,
  defaultHitSlop: 10,
  enableTabPrediction: true,
  tabOffset: 3,
  enableScrollPrediction: true,
  scrollMargin: 150,
});

ForesightDebugger.initialize(ForesightManager.instance, {
  showDebugger: true,
  isControlPanelDefaultMinimized: true, // optional setting which allows you to minimize the control panel on default
  showNameTags: true, // optional setting which shows the name of the element
  sortElementList: 'visibility', // optional setting for how the elements in the control panel are sorted
});
```

```html
<div class="pill-group-horizontal">
  <a href="/feature1" class="pill" foresightjs>Feature 1</a>
  <a href="/feature2" class="pill" foresightjs>Feature 2</a>
  <a href="/feature3" class="pill" foresightjs>Feature 3</a>
</div>
```

```ts
// configure preloading strategy as per routes
    provideRouter(routes, withPreloading(ForesightjsStrategy)),
```
