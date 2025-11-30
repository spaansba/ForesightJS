# CLAUDE.md - js.foresight Package

## Project Purpose & Core Concept

The `js.foresight` package is the **main production library** for ForesightJS - a sophisticated JavaScript/TypeScript library that **predicts user intent before actions occur**. It enables developers to implement **anticipatory UI behaviors** by analyzing mouse trajectories, keyboard navigation patterns, and scroll movements to trigger callbacks before users actually interact with elements.

**Core Innovation**: Instead of waiting for clicks or hovers, ForesightJS calculates where the mouse is heading based on movement history and triggers callbacks when the predicted trajectory intersects with registered elements. This enables prefetching, preloading, and other performance optimizations that make web applications feel faster and more responsive.

## Architecture Overview

### Singleton Pattern

The library uses a **singleton ForesightManager** pattern accessed via `ForesightManager.instance` or `ForesightManager.initialize()`. This ensures consistent global state and prevents multiple instances from conflicting.

### Core Components

**ForesightManager** (`src/manager/ForesightManager.ts`):

- Central orchestrator for all prediction logic
- Manages element registration and lifecycle
- Handles mouse trajectory prediction using linear extrapolation
- Implements keyboard navigation tracking with tabbable elements
- Provides scroll direction prediction
- Automatically cleans up disconnected DOM elements

**Type System** (`src/types/types.ts`):

- Comprehensive TypeScript definitions with 350+ lines of type safety
- Distinguishes between manager settings, element registration options, and internal data
- Event system with typed listeners for all manager activities

**Prediction Algorithms**:

- **Mouse Trajectory**: Linear extrapolation based on position history and configurable prediction time
- **Keyboard Navigation**: Uses `tabbable` library to predict tab order with configurable offset
- **Scroll Prediction**: Detects scroll direction and predicts elements in scroll path

### Key Dependencies

- `position-observer`: Efficient viewport intersection and bounds tracking
- `tabbable`: Reliable tab order calculation for keyboard prediction

## Coding Style & Conventions

### TypeScript First

- Comprehensive type safety with no `any` types
- All interfaces and types extensively documented with JSDoc
- Generic types for framework-agnostic element handling
- Strict type checking for all configuration options

### Event-Driven Architecture

```typescript
// All manager operations emit typed events
this.emit({
  type: "callbackFired",
  timestamp: Date.now(),
  elementData: elementData,
  hitType: callbackHitType,
  managerData: this.getManagerData,
})
```

### Defensive Programming

- Input validation with clamped numeric ranges
- Automatic cleanup of disconnected DOM elements via MutationObserver
- Graceful degradation for touch devices and limited connections
- Error boundaries for event listeners with try/catch blocks

### Performance Optimizations

- Lazy initialization of global event listeners
- Viewport intersection-based optimization (only process visible elements)
- Efficient array slicing for position history management
- AbortController for clean listener removal

### Configuration Management

```typescript
// Settings are validated and clamped on update
private updateNumericSettings(
  newValue: number | undefined,
  setting: NumericSettingKeys,
  min: number,
  max: number
) {
  if (!shouldUpdateSetting(newValue, this._globalSettings[setting])) {
    return false
  }
  this._globalSettings[setting] = clampNumber(newValue, min, max, setting)
  return true
}
```

## Element Registration Flow

1. **Registration**: `ForesightManager.instance.register(options)`
2. **Bounds Calculation**: Element bounds calculated with optional hit slop expansion
3. **Observer Setup**: PositionObserver tracks viewport intersection automatically
4. **Prediction Monitoring**: Mouse/keyboard/scroll events trigger prediction algorithms
5. **Callback Execution**: Callbacks fire when predictions indicate user intent
6. **Auto-cleanup**: Elements automatically unregistered when removed from DOM

## Prediction Logic Details

### Mouse Trajectory Prediction

- Maintains configurable history of mouse positions (2-30 positions)
- Uses linear extrapolation to predict future position based on velocity
- Configurable prediction time window (10-200ms into future)
- Line-segment intersection detection with element bounds

### Keyboard Navigation

- Leverages `tabbable` library for accurate tab order
- Configurable tab offset (0-20 tab stops ahead)
- Handles both forward and reverse tab navigation
- Caches tabbable elements for performance

### Scroll Prediction

- Detects scroll direction by comparing element bounds before/after scroll
- Configurable scroll margin (30-300px) for intersection detection
- Predicts elements in scroll path based on current mouse position

## Testing Strategy

- Vitest for unit testing with comprehensive coverage
- JSDOM and Happy-DOM for DOM simulation
- Testing Library for realistic DOM interaction testing
- Coverage reports via @vitest/coverage-v8

## Build & Distribution

- TypeScript compilation via tsup
- Dual package.json exports (ESM/CommonJS)
- Tree-shakeable exports with individual type exports
- MIT licensed, published as `js.foresight` on npm

## Integration Patterns

- Framework-agnostic core with vanilla JavaScript
- React integration examples in devpage package
- Supports any framework through direct DOM element registration
- Event listeners can be attached for integration with state management

## Performance Characteristics

- Minimal bundle size (~15KB gzipped)
- Efficient memory usage with automatic cleanup
- No polling - purely event-driven
- Respects user preferences (reduced motion, data saver)
- Automatically disabled on touch devices for optimal UX

## Error Handling

- Graceful degradation when prediction conditions aren't met
- Touch device detection with automatic disabling
- Network condition awareness (2G/data saver detection)
- Comprehensive error logging in development mode

This library represents a sophisticated approach to predictive UI interactions, balancing performance, usability, and developer experience while maintaining high code quality standards.

# Typescript

Try to never do type assertion like "type as x" or type any
