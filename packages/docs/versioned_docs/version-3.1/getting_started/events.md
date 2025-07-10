---
sidebar_position: 2
keywords:
  - ForesightJS
  - js.foresight
  - js.foresight-debugger
  - Events
  - Foresight Events
description: Documentation on how to use the built-in js.foresight events
last_updated:
  date: 2025-06-30
  author: Bart Spaans
---

# Events

ForesightManager emits various events during its operation to provide insight into element registration, prediction activities, and callback executions. These events are primarily used by the [ForesightJS DevTools](/docs/getting_started/development_tools) for visual debugging and monitoring, but can also be leveraged for telemetry, analytics, and performance monitoring in your applications.

## Usage

All events can be listened to using the standard `addEventListener` pattern on the ForesightManager instance:

```typescript
import { ForesightManager } from "js.foresight"

// Define handler as const for removal
const handleCallbackInvoked = event => {
  console.log(
    `Callback executed for ${event.elementData.name} in ${event.hitType.kind} mode, which took ${event.elapsed} ms`
  )
}

// Add the event
ForesightManager.instance.addEventListener("callbackInvoked", handleCallbackInvoked)

// Later, remove the listener using the same reference
ForesightManager.instance.removeEventListener("callbackInvoked", handleCallbackInvoked)
```

### Using with AbortController (Signals)

Event listeners support [AbortController signals](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for easy cleanup:

```typescript
const controller = new AbortController()

manager.addEventListener("callbackInvoked", handleCallbackInvoked, { signal: controller.signal })

// Later, remove all listeners added with this signal
controller.abort()
```

## Available Events

### Interaction Events

#### `callbackInvoked`

Fired **_before_** an element's callback is executed.

```typescript
type CallbackInvokedEvent = {
  type: "callbackInvoked"
  timestamp: number
  elementData: ForesightElementData
  hitType: HitType
}
```

#### `callbackCompleted`

Fired **_after_** an element's callback is executed.

```typescript
type CallbackCompletedEvent = {
  type: "callbackCompleted"
  timestamp: number
  elementData: ForesightElementData
  hitType: HitType
  elapsed: number // Time between callbackInvoked and callbackCompleted
  status: "success" | "error"
  errorMessage?: string
}
```

**HitType structure**:

```typescript
type HitType =
  | { kind: "mouse"; subType: "hover" | "trajectory" }
  | { kind: "tab"; subType: "forwards" | "reverse" }
  | { kind: "scroll"; subType: "up" | "down" | "left" | "right" }
```

---

### Element Lifecycle Events

#### `elementRegistered`

Fired when an element is successfully registered with ForesightManager.

```typescript
type ElementRegisteredEvent = {
  type: "elementRegistered"
  timestamp: number
  elementData: ForesightElementData
}
```

---

#### `elementUnregistered`

Fired when an element is removed from ForesightManager tracking.

```typescript
type ElementUnregisteredEvent = {
  type: "elementUnregistered"
  timestamp: number
  elementData: ForesightElementData
  unregisterReason: "callbackHit" | "disconnected" | "apiCall"
}
```

**Unregister reasons**:

- `callbackHit`: Element was automatically unregistered after its callback fired
- `disconnected`: Element was removed from the DOM
- `apiCall`: Manually unregistered via `manager.unregister()`

---

#### `elementDataUpdated`

Fired when tracked element data changes (bounds or visibility).

```typescript
type ElementDataUpdatedEvent = {
  type: "elementDataUpdated"
  elementData: ForesightElementData
  updatedProps: UpdatedDataPropertyNames[] // "bounds" | "visibility"
}
```

### Prediction Events

#### `mouseTrajectoryUpdate`

Fired during mouse movement.

```typescript
type MouseTrajectoryUpdateEvent = {
  type: "mouseTrajectoryUpdate"
  trajectoryPositions: {
    currentPoint: { x: number; y: number }
    predictedPoint: { x: number; y: number }
  }
  predictionEnabled: boolean
}
```

---

#### `scrollTrajectoryUpdate`

Fired during scroll events when scroll prediction is active.

```typescript
type ScrollTrajectoryUpdateEvent = {
  type: "scrollTrajectoryUpdate"
  currentPoint: Point // { x: number; y: number }
  predictedPoint: Point // { x: number; y: number }
  scrollDirection: ScrollDirection // "down" | "up" | "left" | "right"
}
```

---

### Configuration Events

#### `managerSettingsChanged`

Fired when global ForesightManager settings are updated.

```typescript
type ManagerSettingsChangedEvent = {
  type: "managerSettingsChanged"
  timestamp: number
  managerData: Readonly<ForesightManagerData>
  updatedSettings: UpdatedManagerSetting[]
}
```

**managerData**
see [getManagerData](/docs/getting_started/Static_Properties#foresightmanagerinstancegetmanagerdata)

---
