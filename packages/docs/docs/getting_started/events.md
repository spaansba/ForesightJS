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

#### Extra Type Info

[`CallbackHitType`](/docs/getting_started/typescript#callbackhittype)
[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### `callbackCompleted`

Fired **_after_** an element's callback is executed.

```typescript
type CallbackCompletedEvent = {
  type: "callbackCompleted"
  timestamp: number
  elementData: ForesightElementData
  hitType: CallbackHitType
  elapsed: number // Time between callbackInvoked and callbackCompleted
  status: "success" | "error" | undefined
  errorMessage: string | undefined | null
}
```

#### Extra Type Info

[`CallbackHitType`](/docs/getting_started/typescript#callbackhittype)
[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

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

#### Extra Type Info

[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### `elementReactivated`

Fired when the element is reactivated again after its callback has been hit already. This can happen programmatically by hitting `ForesightManager.instance.reactivate(element)` or when the [`reactivateAfter`](/docs/getting_started/config#element-registration-parameters) time runs out on an element.

```typescript
type ElementUnregisteredEvent = {
  type: "elementReactivated"
  timestamp: number
  elementData: ForesightElementData
}
```

#### Extra Type Info

[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### `elementUnregistered`

Fired when an element is removed from ForesightManager's tracking. Can be hit programmatically with `ForesightManager.instance.unregister(element)` or when the element is removed from the DOM.

```typescript
type ElementUnregisteredEvent = {
  type: "elementUnregistered"
  timestamp: number
  elementData: ForesightElementData
  unregisterReason: "callbackHit" | "disconnected" | "apiCall" | "devtools" | (string & {})
  wasLastElement: boolean
}
```

#### Extra Type Info

[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### `elementDataUpdated`

Fired when tracked element data changes. This only tracks bound/visibility and not callback information, for callback information check `callbackInvoked` / `callbackCompleted`.

```typescript
type ElementDataUpdatedEvent = {
  type: "elementDataUpdated"
  elementData: ForesightElementData
  updatedProps: UpdatedDataPropertyNames[] // "bounds" | "visibility"
}
```

#### Extra Type Info

[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

### Prediction Events

#### `mouseTrajectoryUpdate`

Fired during mouse movement, is also fired if `enableMousePrediction` is false since when this is false we fallback to `onHover` over trajectory based.

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

Fired during scroll events when `enableScrollPrediction` is active.

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

#### Extra Type Info

[`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---
