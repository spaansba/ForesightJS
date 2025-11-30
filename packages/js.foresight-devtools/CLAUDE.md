# CLAUDE.md - js.foresight-devtools Package

NEVER EVER CHANGE THE CAPITILIZATION OF FILES OR FOLDERS

## Core Development Principles

**PERFORMANCE and READABILITY are the most important factors in this codebase.** Every code change must prioritize:

1. **Performance**: Optimize for minimal runtime overhead, efficient memory usage, and smooth visual rendering
2. **Readability**: Write clear, self-documenting code that is easy to understand and maintain
3. **Type Safety**: Comprehensive TypeScript usage without type assertions or `any` types

## Project Purpose & Core Concept

The `js.foresight-devtools` package is a **high-performance visual debugging suite** for ForesightJS development built with **Lit web components**. It provides real-time visualization of mouse trajectory predictions, element interactions, and system behavior through an optimized overlay system that transforms invisible prediction algorithms into visible, debuggable experiences.

**Core Innovation**: A complete development environment using modern web component architecture that renders prediction trajectories with efficient canvas operations, shows element boundaries with performant hit slop visualization, provides real-time settings adjustment with immediate visual feedback, and logs all ForesightJS events in an organized control panel.

## Architecture Overview

### Lit-Based Web Component Architecture

This package is built entirely with **Lit 3.x** for maximum performance and component isolation:

```typescript
@customElement("foresight-devtools")
export class ForesightDevtools extends LitElement {
  // Singleton pattern with efficient state management
  private static _instance: ForesightDevtools | null = null
}
```

### Companion Library Design

Designed as a **peer dependency** to `js.foresight` with deep integration into the ForesightManager's event system. It provides comprehensive observability without modifying core library behavior or impacting production performance.

### Core Component Structure (`src/lit-entry/`)

**ForesightDevtools** (`foresight-devtools.ts`):
- Main singleton web component orchestrating all debugging functionality
- Performance-optimized state management with Lit decorators
- Event-driven integration with ForesightManager using typed listeners
- Efficient cleanup and memory management for debugging sessions

**Control Panel System** (`control-panel/`):
- **control-panel.ts**: Main tabbed interface component with efficient rendering
- **base-tab/**: Reusable tab components (chip, expandable-item, tab-content, tab-header, tab-selector)
- **settings-tab/**: Real-time ForesightManager settings control with optimized UI updates
- **element-tab/**: Live element list with efficient sorting and filtering
- **log-tab/**: High-performance event logging with virtual scrolling
- **performance-tab/**: Real-time performance metrics and profiling tools

**Debug Overlay System** (`debug-overlay/`):
- **debug-overlay.ts**: Canvas-based overlay manager with 60fps rendering
- **element-overlays.ts**: Efficient element boundary visualization
- **mouse-trajectory.ts**: Real-time trajectory line rendering with optimized drawing
- **scroll-trajectory.ts**: Scroll prediction visualization with smooth animations

**Dropdown Components** (`dropdown/`):
- **base-dropdown.ts**: Performance-optimized dropdown base class
- **multi-select-dropdown.ts**: Efficient multi-selection with state management
- **single-select-dropdown.ts**: Optimized single selection component

## Performance-Optimized Component Design

### Lit Web Component Benefits

**Efficient Rendering**:
```typescript
// Lit's reactive updates only re-render changed DOM parts
@state() private isInitialized = false

render() {
  return html`
    ${this.isInitialized ? html`<debug-overlay></debug-overlay>` : ''}
  `
}
```

**Optimized Shadow DOM**:
- Complete CSS isolation preventing style conflicts
- Efficient event delegation within shadow boundaries
- Minimal DOM mutations for smooth performance

**Memory Management**:
```typescript
disconnectedCallback() {
  super.disconnectedCallback()
  // Efficient cleanup with AbortController patterns
  this.abortController?.abort()
}
```

### Canvas-Based Visualization

**High-Performance Rendering**:
- 60fps trajectory animation using requestAnimationFrame
- Efficient canvas operations with minimal redraws
- Optimized path drawing algorithms for smooth visual feedback

**Memory-Efficient Drawing**:
```typescript
// Optimized canvas rendering with efficient coordinate calculations
private drawTrajectoryLine(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return
  
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  // Use efficient line drawing with minimal canvas state changes
}
```

## Type System & Integration (`src/types/types.ts`)

### Comprehensive Type Safety

**DevtoolsSettings Interface**:
- Complete type coverage for all configuration options
- Performance-optimized defaults for production use
- Type-safe event logging configuration

**Integration Types**:
```typescript
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

// Efficient type checking without runtime overhead
export type SortElementList = "visibility" | "documentOrder" | "insertionOrder"
```

### Event System Integration

**Type-Safe Event Handling**:
- Full type safety with ForesightJS event system
- Efficient event serialization preventing circular references
- Performance-optimized logging with configurable verbosity

## Helper Functions (`src/helpers/`)

### Safe Event Serialization

**safeSerializeEventData.ts**:
- Performance-optimized JSON serialization
- Circular reference prevention without memory leaks
- Efficient deep cloning for complex event data

## Development Commands & Workflow

### Package-Specific Commands

Navigate to `packages/js.foresight-devtools/`:

- `pnpm build` - Build with sourcemaps for development
- `pnpm build:prod` - Production build via tsup (optimized bundle)
- `pnpm dev` - Watch mode with live rebuilding
- `pnpm test` - Run Vitest unit tests
- `pnpm test:watch` - Continuous testing during development

### Integration with Main Library

**Peer Dependency Pattern**:
```json
{
  "peerDependencies": {
    "js.foresight": "^3.2.0"
  }
}
```

**Runtime Dependencies**:
- `lit`: High-performance web component framework
- `@thednp/position-observer`: Efficient viewport intersection tracking

## Advanced UI Features

### Performance-Optimized Control Panel

**Tabbed Interface with Efficient Switching**:
- Lazy loading of tab content for optimal memory usage
- Efficient state management across tab switches
- Optimized re-rendering with Lit's reactive updates

**Real-Time Settings Control**:
- Immediate visual feedback with debounced updates
- Performance-optimized range sliders with smooth animation
- Efficient two-way binding with ForesightManager settings

### Element List Performance

**Efficient Sorting and Filtering**:
```typescript
// Optimized sorting algorithms for large element lists
sortElementList: SortElementList = "visibility" // Most efficient default
```

**Virtual Scrolling for Large Lists**:
- Handle hundreds of registered elements efficiently
- Minimal DOM nodes for optimal memory usage
- Smooth scrolling performance with lazy rendering

### Event Logging System

**High-Performance Logging**:
- Configurable log levels to minimize performance impact
- Efficient event filtering with optimized data structures
- Memory-bounded log storage preventing memory leaks

## Visual Performance Optimizations

### Canvas Rendering Efficiency

**Optimized Drawing Operations**:
- Minimal canvas state changes for smooth 60fps rendering
- Efficient coordinate transformations and path operations
- Performance-aware redraw scheduling with requestAnimationFrame

**Memory Management**:
- Proper canvas cleanup preventing memory leaks
- Efficient image data handling for visual overlays
- Optimized rendering pipelines for complex visualizations

### CSS Performance

**Efficient Styling**:
```css
/* Performance-optimized CSS with hardware acceleration */
.trajectory-line {
  will-change: transform;
  transform: translateZ(0); /* Force hardware acceleration */
}
```

## Error Handling & Edge Cases

### Performance-Aware Error Handling

**Graceful Degradation**:
```typescript
// Efficient existence checks preventing performance penalties
if (!this.shadowRoot?.querySelector('.control-panel')) {
  return // Early return pattern for optimal performance
}
```

**Memory Leak Prevention**:
- Comprehensive AbortController usage for automatic cleanup
- Efficient event listener management with proper disposal
- Performance-monitored component lifecycle management

## Build System & Distribution

### Optimized Build Pipeline

**tsup Configuration**:
- Fast TypeScript compilation with optimized output
- Tree-shakeable ESM/CommonJS exports
- Production builds with aggressive minification and dead code elimination

**Development Optimizations**:
- Hot module replacement for instant feedback
- Source maps for efficient debugging
- Watch mode with incremental compilation

## Performance Characteristics

### Minimal Production Impact

**Development-Only Features**:
- Zero performance impact when not explicitly loaded
- Conditional loading preventing production bundle pollution
- Efficient feature detection for development environments

**Runtime Performance**:
- Sub-millisecond event handling with optimized listeners
- Canvas operations optimized for 60fps rendering
- Memory usage monitored and bounded for long-running sessions

### Benchmarking and Monitoring

**Built-in Performance Monitoring**:
- Real-time performance metrics in debug panel
- Memory usage tracking with visual indicators
- Rendering performance profiling with detailed breakdowns

This package represents a sophisticated, performance-optimized development tool built with modern web component architecture, enabling developers to visualize, debug, and tune their ForesightJS implementations with minimal performance overhead and maximum development efficiency.

NEVER EVER CHANGE THE CAPITILIZATION OF FILES OR FOLDERS

# TypeScript Standards

- Never use type assertions (`as` operator) or `any` types
- Prefer comprehensive type definitions over loose typing
- Use generic types for component-agnostic compatibility
- Validate all inputs with proper type guards

# Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
