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

const manager = ForesightManager.initialize(/* your config */)

// Define handler as const for removal
const handleCallbackFired = event => {
  console.log(`Callback executed for ${event.elementData.name} in ${event.hitType.kind} mode`)
}

// Add the listener
manager.addEventListener("callbackFired", handleCallbackFired)

// Or if you dont have access to the manager
ForesightManager.instance.addEventListener("callbackFired", handleCallbackFired)

// Later, remove the listener using the same reference
manager.removeEventListener("callbackFired", handleCallbackFired)
```

### Using with AbortController (Signals)

Event listeners support [AbortController signals](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for easy cleanup:

```typescript
const controller = new AbortController()

manager.addEventListener(
  "callbackFired",
  event => {
    // Handle event (this allows for a)
  },
  { signal: controller.signal }
)

// Later, remove all listeners added with this signal
controller.abort()
```

## Available Events

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
  timestamp: number
  elementData: ForesightElementData
  updatedProp: "bounds" | "visibility"
}
```

**updatedProp** values:

- `bounds`: Element's position or size changed (detected via ResizeObserver and MutationObserver)
- `visibility`: Element's viewport intersection status changed. We track visibility for performance gains by only observing elements that are actually visible to the user, reducing unnecessary calculations for off-screen elements

---

### Interaction Events

#### `callbackFired`

Fired when an element's callback is executed due to user interaction prediction or actual interaction.

```typescript
type CallbackFiredEvent = {
  type: "callbackFired"
  timestamp: number
  elementData: ForesightElementData
  hitType: HitType
  managerData: ForesightManagerData
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

### Prediction Events

#### `mouseTrajectoryUpdate`

Fired during mouse movement.

```typescript
type MouseTrajectoryUpdateEvent = {
  type: "mouseTrajectoryUpdate"
  timestamp: number
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
  timestamp: number
  currentPoint: { x: number; y: number }
  predictedPoint: { x: number; y: number }
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
  newSettings: ForesightManagerSettings
}
```

---
