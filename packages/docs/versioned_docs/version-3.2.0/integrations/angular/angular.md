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
npm install js.foresight ngx-foresight
npm install -D js.foresight-devtools
# or
pnpm add js.foresight js.foresight-devtools ngx-foresight
pnpm add -D js.foresight-devtools
```

After that import the `ForesightjsDirective` to the components with `href` and `routerLink`, and use the `ForesightjsStrategy` as `preloadingStrategy` in the router's configuration. For example:

```ts
import { ForesightManager } from 'js.foresight';
import { ForesightDevtools } from 'js.foresight-devtools';
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

ForesightDevtools.initialize({
  showDebugger: true,
  isControlPanelDefaultMinimized: true, // optional setting which allows you to minimize the control panel on default
  showNameTags: true, // optional setting which shows the name of the element
  sortElementList: 'visibility', // optional setting for how the elements in the control panel are sorted
});
```

```html
<div class="pill-group-horizontal">
  <a href="/feature1" class="pill" registerForesight="Feature 1">Feature 1</a>
  <a href="/feature2" class="pill" registerForesight="Feature 2">Feature 2</a>
  <a href="/feature3" class="pill" registerForesight="Feature 3">Feature 3</a>
</div>
```

```ts
// configure preloading strategy as per routes
  provideRouter(routes, withPreloading(ForesightjsStrategy)),
// for older versions
  RouterModule.forRoot(routes, { preloadingStrategy: ForesightjsStrategy })
```