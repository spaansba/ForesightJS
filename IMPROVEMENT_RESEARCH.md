# ForesightJS - Comprehensive Improvement Research Report

## Executive Summary

ForesightJS is a well-architected, lightweight library for predicting user intent to enable prefetching. After thorough analysis of the codebase, I've identified improvements across **5 major categories**: Core Algorithm Enhancements, Architecture Refactoring, Testing Gaps, Developer Experience, and New Features.

---

## 1. Core Algorithm Improvements

### 1.1 Enhanced Mouse Trajectory Prediction

**Current State**: Uses simple linear velocity extrapolation (constant velocity assumption)

```typescript
// Current: predictNextMousePosition.ts:43-50
const vx = dx / dt
const vy = dy / dt
const predictedX = x + vx * trajectoryPredictionTimeInSeconds
```

**Improvements**:

| Enhancement                       | Description                                                           | Impact                                             |
| --------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| **Acceleration-aware prediction** | Add second-order derivative (acceleration) for curved mouse paths     | Better accuracy for arc/curve movements            |
| **Weighted velocity**             | Weight recent positions more heavily using exponential moving average | Smoother predictions, less jitter                  |
| **Velocity confidence scoring**   | Return confidence level (0-1) based on movement consistency           | Allow consumers to make smarter prefetch decisions |
| **Bezier curve fitting**          | Fit recent points to a quadratic Bezier for curved prediction         | Natural cursor arc following                       |

**Example acceleration model**:

```typescript
// Proposed: add acceleration term
const ax = (vx_current - vx_prev) / dt // acceleration
predictedX = x + vx * t + 0.5 * ax * t * t // kinematic equation
```

### 1.2 Scroll Prediction Enhancement

**Current State**: Single-axis direction detection with fixed margin (`predictNextScrollPosition.ts`)

**Improvements**:

- **Diagonal scroll support**: Detect and predict diagonal scroll vectors
- **Scroll velocity tracking**: Use scroll speed to scale prediction distance
- **Momentum detection**: Account for inertial scrolling on touch devices
- **Scroll deceleration model**: Predict scroll stop position for momentum scrolling

### 1.3 Prediction Precision Factor (Proposed Feature)

**Problem**: Currently, ForesightJS triggers callbacks for ANY element intersecting the predicted trajectory line. This causes false positives when users are just "passing through" an element to reach something else.

**Solution**: Add a `predictionPrecision` setting (0-100) at both global and element level that controls how strictly the prediction must match:

| Value   | Behavior                                                        | Use Case                                   |
| ------- | --------------------------------------------------------------- | ------------------------------------------ |
| **0**   | Triggers for anything in the trajectory path (current behavior) | Aggressive prefetching, low-cost callbacks |
| **50**  | Balanced - weights distance to predicted stop point             | General purpose                            |
| **100** | Only triggers if predicted stop point is inside element         | Conservative, high-cost callbacks          |

#### Type Definitions

```typescript
// Global setting
interface ForesightManagerSettings {
  // ... existing
  /**
   * Controls prediction precision/strictness (0-100)
   * - 0: Trigger for any element in trajectory path (most aggressive)
   * - 100: Only trigger if predicted stop point is inside element (most conservative)
   * @default 0
   */
  predictionPrecision: number
}

// Per-element override
interface ForesightRegisterOptions {
  // ... existing
  /**
   * Override global predictionPrecision for this element
   * Useful for expensive callbacks that should only fire with high confidence
   */
  predictionPrecision?: number
}
```

#### Algorithm Design

```typescript
// New helper: calculateStopPoint.ts
interface StopPointResult {
  stopPoint: Point // Where cursor will stop (velocity -> 0)
  timeToStop: number // Milliseconds until stop
  confidence: number // 0-1 confidence in prediction
}

/**
 * Calculates where the cursor will stop based on velocity decay
 * Uses exponential decay model: v(t) = v0 * e^(-kt)
 */
function calculateStopPoint(
  currentPoint: Point,
  velocity: Point, // pixels/second
  decayFactor: number = 5 // Higher = faster deceleration assumption
): StopPointResult {
  // Distance traveled during deceleration: d = v0 / k
  const stopDistanceX = velocity.x / decayFactor
  const stopDistanceY = velocity.y / decayFactor

  return {
    stopPoint: {
      x: currentPoint.x + stopDistanceX,
      y: currentPoint.y + stopDistanceY,
    },
    timeToStop: 1000 / decayFactor, // Approximate time to ~95% velocity decay
    confidence: calculateConfidence(velocity, buffer),
  }
}
```

#### Hit Detection with Precision

```typescript
// Modified MousePredictor.processMouseMovement logic
function shouldTriggerCallback(
  currentPoint: Point,
  predictedPoint: Point, // Current: trajectoryPredictionTime ahead
  stopPoint: Point, // New: where cursor will stop
  elementRect: Rect,
  precision: number // 0-100
): boolean {
  if (precision === 0) {
    // Current behavior: any intersection with trajectory line
    return lineSegmentIntersectsRect(currentPoint, predictedPoint, elementRect)
  }

  if (precision === 100) {
    // Strictest: stop point must be inside element
    return isPointInRectangle(stopPoint, elementRect)
  }

  // Interpolated behavior (0 < precision < 100)
  // Method 1: Shorten the prediction line toward stop point
  const t = precision / 100
  const interpolatedEnd = {
    x: predictedPoint.x + (stopPoint.x - predictedPoint.x) * t,
    y: predictedPoint.y + (stopPoint.y - predictedPoint.y) * t,
  }

  // Check intersection with shortened line
  if (!lineSegmentIntersectsRect(currentPoint, interpolatedEnd, elementRect)) {
    return false
  }

  // Method 2: Weight by distance from stop point to element center
  const elementCenter = getRectCenter(elementRect)
  const distanceToCenter = distance(stopPoint, elementCenter)
  const maxDistance = Math.max(elementRect.width, elementRect.height)
  const distanceScore = 1 - Math.min(distanceToCenter / maxDistance, 1)

  // Require higher distance score as precision increases
  const requiredScore = precision / 100
  return distanceScore >= requiredScore
}
```

#### Visual Representation

```
Precision = 0 (Current behavior)
================================
     User -----> [Element A] -----> [Element B] -----> Target
                     ^                  ^
                     |                  |
              Both trigger (any intersection)


Precision = 100 (Stop point only)
=================================
     User -----> [Element A] -----> [Element B] -----> Target
                                                          ^
                                                          |
                                              Only Target triggers
                                           (stop point is inside)


Precision = 50 (Balanced)
=========================
     User -----> [Element A] -----> [Element B] -----> Target
                                        ^                 ^
                                        |                 |
                              Element B & Target trigger
                         (closer to predicted stop point)
```

#### Implementation Locations

| File                                    | Changes Required                                               |
| --------------------------------------- | -------------------------------------------------------------- |
| `types.ts`                              | Add `predictionPrecision` to settings and register options     |
| `constants.ts`                          | Add `DEFAULT_PREDICTION_PRECISION = 0`, `MIN = 0`, `MAX = 100` |
| `ForesightManager.ts`                   | Add setting initialization and update logic                    |
| `MousePredictor.ts`                     | Integrate precision check in `processMouseMovement`            |
| `helpers/calculateStopPoint.ts`         | New file for stop point calculation                            |
| `helpers/shouldTriggerWithPrecision.ts` | New file for precision-aware hit detection                     |

#### DevTools Integration

```typescript
// Add to control panel settings tab
{
  label: "Prediction Precision",
  type: "slider",
  min: 0,
  max: 100,
  step: 5,
  value: settings.predictionPrecision,
  description: "0 = aggressive (any intersection), 100 = conservative (stop point only)"
}

// Visualization: Show stop point as distinct marker
// - Circle at predicted stop point
// - Color gradient from green (high confidence) to red (low confidence)
// - Dotted line from predicted point to stop point
```

#### Example Usage

```typescript
// Global: Default to current behavior
ForesightManager.initialize({
  predictionPrecision: 0, // Same as before
})

// Global: More conservative for performance-sensitive sites
ForesightManager.initialize({
  predictionPrecision: 50,
})

// Per-element: Expensive API call, only fire when confident
ForesightManager.instance.register({
  element: checkoutButton,
  callback: () => prefetchCheckoutData(), // Expensive!
  predictionPrecision: 80, // Override global, be more conservative
})

// Per-element: Cheap prefetch, be aggressive
ForesightManager.instance.register({
  element: navLink,
  callback: () => prefetchRoute("/about"), // Cheap
  predictionPrecision: 0, // Fire early and often
})
```

#### Benefits

1. **Reduce false positives**: Higher precision = fewer wasted prefetches
2. **Per-element control**: Expensive callbacks can require higher confidence
3. **Backward compatible**: Default of 0 maintains current behavior
4. **Tunable**: Users can find their optimal balance
5. **Analytics-friendly**: Track hit rate at different precision levels

---

### 1.4 Intent Classification System

**New Feature**: Add user intent classification beyond basic hit detection

```typescript
// Proposed: IntentClassifier
type UserIntent =
  | { type: "direct"; confidence: number } // Moving straight toward element
  | { type: "passing"; confidence: number } // Will pass through, not targeting
  | { type: "hesitant"; confidence: number } // Slow approach, high dwell time
  | { type: "exploring"; confidence: number } // Random movement pattern
```

Benefits:

- Reduce false positive prefetches for "passing" movements
- Enable different callback priorities based on intent confidence
- Add analytics for user behavior patterns

---

## 2. Architecture & Code Quality

### 2.1 ForesightManager Refactoring (Critical)

**Problem**: `ForesightManager.ts` is 900 lines handling 6+ responsibilities

**Proposed extraction**:

```
ForesightManager (orchestrator only)
├── SettingsService          // Settings validation, persistence, events
├── ElementRegistry          // Element registration, lifecycle, bounds
├── CallbackExecutor         // Callback timing, error handling, reactivation
├── EventBus                 // Type-safe event emission/subscription
└── DeviceDetector           // Touch/mouse/pen strategy detection
```

**Specific refactors**:

1. **Extract `alterGlobalSettings()` repetition** (lines 718-893):

```typescript
// Current: 175 lines of repetitive if-changed-then-push patterns
// Proposed: Generic setting updater
private updateSetting<K extends keyof ForesightManagerSettings>(
  key: K,
  newValue: ForesightManagerSettings[K] | undefined,
  validator?: (v: ForesightManagerSettings[K]) => ForesightManagerSettings[K]
): UpdatedManagerSetting | null
```

2. **Extract callback execution** (lines 424-489):

```typescript
// Move to: CallbackExecutor.ts
class CallbackExecutor {
  async execute(elementData: ForesightElementData, hitType: CallbackHitType): Promise<void>
  private scheduleReactivation(elementData: ForesightElementData): void
  private updateHitCounters(hitType: CallbackHitType): void
}
```

### 2.2 Remove Circular Dependency Risk

**Problem**: `shouldRegister.ts:6` imports `ForesightManager` to access settings

```typescript
// Current: shouldRegister.ts
const settings = ForesightManager.instance._globalSettings
```

**Fix**: Pass settings as parameter or use dependency injection:

```typescript
export function evaluateRegistrationConditions(
  settings: Pick<ForesightManagerSettings, "minimumConnectionType" | "touchDeviceStrategy">
): RegistrationConditions
```

### 2.3 Type Safety Improvements

**Issues found**:

- 3 `eslint-disable` comments for type bypasses
- Non-null assertions (`!`) without guards in devtools
- `as` casts without runtime validation

**Recommendations**:

1. Replace `navigator.connection` any type with proper `NetworkInformation` interface
2. Add runtime type guards before `as ForesightElement` casts
3. Replace `!` assertions with optional chaining or explicit guards

---

## 3. Testing Gaps (Critical)

### 3.1 Current Coverage Analysis

| Component          | Lines | Test Coverage | Priority     |
| ------------------ | ----- | ------------- | ------------ |
| Helper functions   | 400   | ~95%          | N/A          |
| ForesightManager   | 900   | 0%            | **Critical** |
| MousePredictor     | 87    | 0%            | High         |
| ScrollPredictor    | 85    | 0%            | High         |
| TabPredictor       | 131   | 0%            | High         |
| DesktopHandler     | 169   | 0%            | High         |
| TouchDeviceHandler | 78    | 0%            | Medium       |
| ViewportPredictor  | 50    | 0%            | Medium       |
| DevTools (entire)  | 5,335 | <1%           | High         |

### 3.2 Recommended Test Additions

**1. ForesightManager Integration Tests**:

```typescript
describe("ForesightManager", () => {
  it("registers element and tracks bounds correctly")
  it("fires callback when trajectory intersects element")
  it("respects reactivateAfter timing")
  it("handles rapid register/unregister cycles")
  it("cleans up on element DOM removal")
  it("switches device strategy on pointer type change")
  it("respects network limitations")
})
```

**2. Predictor Behavior Tests**:

```typescript
describe("MousePredictor", () => {
  it("fires trajectory callback when predicted path crosses element")
  it("fires hover callback when prediction disabled")
  it("skips elements not in viewport")
  it("handles rapid mouse movements without memory leak")
})
```

**3. Performance Tests**:

```typescript
describe("Performance", () => {
  it("handles 100+ registered elements without frame drops")
  it("circular buffer operations stay O(1)")
  it("no memory leaks after 1000 register/unregister cycles")
})
```

**4. DevTools Tests** (currently placeholder only):

- Control panel interactions
- Visualization canvas rendering
- Event log filtering
- Settings synchronization

---

## 4. Developer Experience Improvements

### 4.1 Error Messages & Debugging

**Current**: Generic console.error in callback execution

**Improvement**: Structured error codes with actionable guidance

```typescript
// Proposed: ForesightError class
class ForesightError extends Error {
  constructor(
    public code: "CALLBACK_TIMEOUT" | "INVALID_ELEMENT" | "NETWORK_LIMITED",
    message: string,
    public context?: Record<string, unknown>
  ) {}
}
```

### 4.2 TypeScript Exports

**Missing exports** that would help consumers:

- `BaseForesightModule` (for custom predictor extensions)
- Individual predictor classes (for testing/mocking)
- `CircularBuffer` (useful utility)
- Internal geometry helpers

### 4.3 Documentation Gaps

**Code-level**:

- `ForesightManager` needs inline comments explaining complex flows
- `asyncCallbackWrapper` timing logic (lines 431-488) is complex and undocumented
- Cache invalidation strategy in `TabPredictor` needs explanation

**Missing architectural docs**:

- Sequence diagram for callback flow
- State machine diagram for element lifecycle
- Decision tree for device strategy selection

### 4.4 Add Debug Mode Enhancements

```typescript
// Proposed: Enhanced debug output
interface DebugEvent {
  timestamp: number
  category: "prediction" | "callback" | "lifecycle" | "performance"
  level: "trace" | "debug" | "info" | "warn"
  message: string
  data?: unknown
}
```

---

## 5. New Feature Opportunities

### 5.1 Priority Queue for Callbacks

**Problem**: All callbacks treated equally regardless of prefetch importance

**Solution**: Add priority levels for registered elements

```typescript
interface ForesightRegisterOptions {
  // ... existing
  priority?: "critical" | "high" | "normal" | "low"
  prefetchWeight?: number // 0-1, higher = more eager prefetch
}
```

### 5.2 Batch Callback Support

**Use case**: Prefetch multiple resources when predicting navigation to a page

```typescript
// Proposed: Group callbacks
ForesightManager.instance.registerGroup({
  elements: [navLink, heroImage, criticalCSS],
  callback: () => prefetchPage("/about"),
  strategy: "any" | "all", // trigger on any element or all
})
```

### 5.3 Analytics & Telemetry API

```typescript
// Proposed: Built-in analytics
interface PredictionAnalytics {
  totalPredictions: number
  accuratePredictions: number  // user actually clicked
  falsePositives: number       // predicted but didn't click
  averagePrefetchTime: number  // ms before actual click
  hitRateByType: Record<CallbackHitType['kind'], number>
}

ForesightManager.instance.getAnalytics(): PredictionAnalytics
```

### 5.4 Adaptive Prediction Tuning

**Concept**: Auto-tune prediction parameters based on accuracy

```typescript
// Self-tuning based on hit/miss ratio
interface AdaptiveSettings {
  enabled: boolean
  targetAccuracy: number // 0.7 = 70% accurate predictions
  learningRate: number // How fast to adjust
}
```

### 5.5 Element Grouping & Zones

```typescript
// Define prediction zones instead of individual elements
ForesightManager.instance.registerZone({
  bounds: { top: 0, left: 0, right: 200, bottom: 600 },
  callback: () => prefetchSidebar(),
  name: "sidebar-zone",
})
```

### 5.6 Pen/Stylus Optimization

**Current**: Pen treated same as touch

**Improvement**: Pen-specific prediction using pressure and tilt data

```typescript
interface PenPredictionSettings {
  usePressureForConfidence: boolean // Higher pressure = more certain
  useTiltForDirection: boolean // Tilt indicates intended direction
}
```

---

## 6. CI/CD & Infrastructure

### 6.1 Missing Automation

| Feature                | Status     | Recommendation                        |
| ---------------------- | ---------- | ------------------------------------- |
| GitHub Actions CI      | Missing    | Add test/lint/build on PR             |
| Pre-commit hooks       | Missing    | Add husky for lint-staged             |
| Automated releases     | Missing    | semantic-release or changesets        |
| Coverage reporting     | Local only | Add Codecov/Coveralls integration     |
| Bundle size tracking   | Missing    | Add size-limit checks                 |
| Performance benchmarks | Missing    | Add benchmark suite with vitest/bench |

### 6.2 Proposed GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build:prod
```

---

## 7. Code Smells Identified

### 7.1 Critical Issues

1. **ForesightManager Singleton Complexity (900 lines)**
   - Class handles too many responsibilities: registration, event management, callback execution, setting management, device detection
   - Consider extracting into separate services: SettingsManager, CallbackExecutor, RegistrationService

2. **Devtools Test File is Placeholder**
   - `devtools.test.ts` contains single placeholder test with TODO comment
   - Devtools (30 files) likely has zero meaningful test coverage

3. **Circular Dependency Risk**
   - `shouldRegister.ts` imports `ForesightManager` and calls `ForesightManager.instance` to get settings
   - This creates a hard dependency during initialization and could cause issues

4. **Non-null Assertions**
   - Multiple `!` assertions without guards (e.g., `ForesightDevtools._instance!`)
   - Could mask runtime errors if instance creation fails

### 7.2 Moderate Issues

5. **Setting Updates Repetition**
   - ~100 lines in `alterGlobalSettings()` following identical pattern (check changed, push to array, update)
   - Should be abstraction: `updateSetting<T>(key, newValue, min, max, changedSettings)`

6. **Mutable Shared State Without Defensive Copies**
   - Elements Map passed as readonly reference but internal state is mutated
   - No immutable patterns to prevent accidental mutations

7. **Missing Null/Undefined Checks**
   - PositionObserver could be null but not always checked
   - TouchDeviceHandler.predictor could be null but passed to methods without guards

8. **Type Casts Without Validation**
   - `entry.target as ForesightElement` in ViewportPredictor without instanceof check
   - Multiple `as ForesightElement` casts that assume safety

### 7.3 Minor Issues

9. **TODO Comments in Code**
   - `TouchStartPredictor.ts` has comment "Change to touchstart ones it is baseline"
   - Indicates incomplete migration pattern

10. **Inconsistent Error Handling**
    - Some async callbacks catch errors and log, others don't
    - Error messages could be more structured for debugging

11. **Cache Invalidation Complexity**
    - TabPredictor cache invalidation strategy is unclear when exactly it triggers
    - LastFocusedIndex reset to null could cause issues

12. **Boolean Setting Flags**
    - Multiple boolean flags (isCallbackActive, isRunningCallback) that could be replaced with state machine

---

## 8. Priority Matrix

| Improvement                     | Impact   | Effort     | Priority |
| ------------------------------- | -------- | ---------- | -------- |
| ForesightManager refactoring    | High     | High       | **P0**   |
| Integration tests for manager   | High     | Medium     | **P0**   |
| **Prediction Precision Factor** | **High** | **Medium** | **P1**   |
| CI/CD pipeline                  | High     | Low        | **P1**   |
| Remove circular dependency      | Medium   | Low        | **P1**   |
| DevTools test coverage          | Medium   | Medium     | **P1**   |
| Acceleration-aware prediction   | Medium   | Medium     | **P2**   |
| Intent classification           | High     | High       | **P2**   |
| Analytics API                   | Medium   | Medium     | **P2**   |
| Adaptive tuning                 | Medium   | High       | **P3**   |
| Batch callbacks                 | Low      | Medium     | **P3**   |

---

## 9. Maintainability Scorecard

| Dimension           | Score      | Status                                            |
| ------------------- | ---------- | ------------------------------------------------- |
| Code Organization   | 7/10       | Good with manager refactoring needed              |
| TypeScript Safety   | 8/10       | Strong with minor type escape hatches             |
| Documentation       | 6/10       | Good high-level, weak implementation details      |
| Dependency Mgmt     | 8/10       | Excellent minimalism, minor version consolidation |
| Build & Development | 7/10       | Solid setup, needs CI/CD automation               |
| Code Patterns       | 7/10       | Consistent with duplication concerns              |
| Code Smells         | 5/10       | Several architectural issues identified           |
| **Overall**         | **6.9/10** | **Good foundation, refactoring recommended**      |

---

## 10. Summary

ForesightJS has a solid foundation with excellent type safety and minimal dependencies. The highest-impact improvements are:

1. **Refactor ForesightManager** - Split 900-line god class into focused services
2. **Add integration tests** - 0% coverage on core business logic is risky
3. **Add Prediction Precision Factor** - Global and per-element setting (0-100) to control prediction strictness:
   - `0` = Current behavior (any trajectory intersection triggers)
   - `100` = Only trigger when predicted stop point is inside element
   - Reduces false positives, allows expensive callbacks to require high confidence
4. **Implement CI/CD** - Automated testing prevents regressions
5. **Add analytics API** - Help users measure prediction effectiveness

The codebase is well-positioned for these improvements due to its modular predictor architecture and strong typing foundation.

---

_Report generated: January 2026_
_Analysis scope: packages/js.foresight, packages/js.foresight-devtools_
