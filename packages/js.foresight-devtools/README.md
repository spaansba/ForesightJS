# ForesightJS Development Tools

[![npm version](https://img.shields.io/npm/v/js.foresight-devtools.svg)](https://www.npmjs.com/package/js.foresight-devtools)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Visual development tools for [ForesightJS](https://foresightjs.com/) - a library that predicts user intent by analyzing mouse movements, scroll behavior, and keyboard navigation to enable proactive actions like prefetching.

## What are the ForesightJS Development Tools?

The ForesightJS Development Tools are a companion development package that provides visual development capabilities for ForesightJS implementations. They help developers understand and tune how ForesightJS is working in their applications by providing real-time visualization of:

- **Mouse trajectory predictions** - See predicted cursor paths and intersection points
- **Element bounds and hit slop areas** - Visualize registered elements and their interaction zones
- **Keyboard navigation sequences** - Track tab-based navigation predictions
- **Callback execution** - Monitor when and why prediction callbacks fire
- **Real-time settings control** - Adjust ForesightJS parameters on the fly

![ForesightJS Development Tools Demo](https://github.com/user-attachments/assets/36c81a82-fee7-43d6-ba1e-c48214136f90)

## Installation

```bash
pnpm add -D js.foresight-devtools
# or
npm install -D js.foresight-devtools
# or
yarn add -D js.foresight-devtools
```

## Basic Usage

```javascript
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize ForesightJS
ForesightManager.initialize()

// Initialize development tools
ForesightDevtools.initialize(ForesightManager.instance)
```

## Configuration Options

```typescript
type DevelopmentToolsSettings = {
  showDebugger?: boolean
  isControlPanelDefaultMinimized?: boolean
  showNameTags?: boolean // Show element names on overlays
  sortElementList?: "documentOrder" | "visibility" | "insertionOrder" // Control panel sorting
}
```

### Available Development Tools Settings

**TypeScript Type:** `DevelopmentToolsSettings`

| Setting                          | Type              | Default      | Description                                                                                                                                                                       |
| -------------------------------- | ----------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showDebugger`                   | `boolean`         | `true`       | Controls whether the development tools are visible and active                                                                                                                     |
| `isControlPanelDefaultMinimized` | `boolean`         | `false`      | When true, the development tools control panel will be minimized on page load                                                                                                     |
| `showNameTags`                   | `boolean`         | `true`       | Shows the element `name` (or `id` if no `name` is given) above registered elements                                                                                                |
| `sortElementList`                | `SortElementList` | `visibility` | Controls element sorting in control panel: `visibility` sorts by viewport visibility, `documentOrder` sorts by HTML structure order, `insertionOrder` sorts by registration order |

### Usage Example with All Options

```javascript
import { ForesightManager } from "js.foresight"
import { ForesightDevtools } from "js.foresight-devtools"

// Initialize ForesightJS
ForesightManager.initialize({
  trajectoryPredictionTime: 100,
  defaultHitSlop: { top: 10, right: 10, bottom: 10, left: 10 },
  enableMousePrediction: true,
  enableTabPrediction: true,
  enableScrollPrediction: true,
})

// Initialize development tools with custom settings
ForesightDevtools.initialize(ForesightManager.instance, {
  showDebugger: true,
  isControlPanelDefaultMinimized: false,
  showNameTags: true,
  sortElementList: "visibility",
})

// Register elements as usual
ForesightManager.instance.register({
  element: document.getElementById("my-button"),
  callback: () => {
    console.log("Prediction triggered!")
  },
  name: "my-button", // This name will appear in the development tools
})
```

## Development Workflow

The development tools are particularly useful when:

1. **Setting up ForesightJS** for the first time in an application
2. **Fine-tuning prediction parameters** for specific UI components
3. **Debugging callback execution** issues or unexpected behavior
4. **Optimizing hit slop areas** for better user experience
5. **Understanding prediction accuracy** across different interaction patterns

## Framework Integration

Since both ForesightJS and the development tools are framework-agnostic, you can use them together in any JavaScript environment:

- React / Next.js
- Vue / Nuxt
- Angular
- Svelte / SvelteKit
- Vanilla JavaScript

## Requirements

- **js.foresight** ^3.0.0 (peer dependency)

## License

MIT © [Bart Spaans](https://github.com/spaansba)

## Related

- [ForesightJS](https://foresightjs.com/) - The main prediction library
- [Documentation](https://foresightjs.com/docs) - Comprehensive guides and API reference
- [GitHub](https://github.com/spaansba/ForesightJS) - Source code and issues
