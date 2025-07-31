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
  date: 2025-07-31
  author: Bart Spaans
---

# Events

ForesightManager emits various events during to provide insight into element registration, prediction activities, and callback executions. These events are primarily used by the [ForesightJS DevTools](/docs/getting_started/development_tools) for visual debugging and monitoring, but can also be leveraged for telemetry, analytics, and performance monitoring in your applications.

## Usage

All events are visible in the logs tab of the [devtools](/docs/getting_started/development_tools). However for tracking/analytics in production, implementing them in your own code is straightforward with the standard `addEventListener` pattern.

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

### AbortController support

Event listeners support [AbortController signals](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for easy cleanup.

```typescript
const controller = new AbortController()

manager.addEventListener("callbackInvoked", handleCallbackInvoked, { signal: controller.signal })

controller.abort()
```

## Available Events

### Interaction Events

Events fired when user interactions trigger callbacks.

---

#### <code style={{backgroundColor: '#1e293b', color: '#22c55e', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>callbackInvoked</code>

Fired **before** an element's callback is executed

```typescript
type CallbackInvokedEvent = {
  type: "callbackInvoked"
  timestamp: number
  elementData: ForesightElementData
  hitType: HitType
}
```

**Related Types:** [`CallbackHitType`](/docs/getting_started/typescript#callbackhittype) • [`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### <code style={{backgroundColor: '#1e293b', color: '#22c55e', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>callbackCompleted</code>

Fired **after** an element's callback is executed

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

**Related Types:** [`CallbackHitType`](/docs/getting_started/typescript#callbackhittype) • [`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

### Element Lifecycle Events

Events fired during element registration, updates, and cleanup.

---

#### <code style={{backgroundColor: '#1e293b', color: '#f97316', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>elementRegistered</code>

Fired when an element is successfully registered with `ForesightManager` using `foresightmanager.instance.register(element)`.

```typescript
type ElementRegisteredEvent = {
  type: "elementRegistered"
  timestamp: number
  elementData: ForesightElementData
}
```

**Related Types:** [`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### <code style={{backgroundColor: '#1e293b', color: '#f97316', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>elementReactivated</code>

Fired when an element is reactivated after its callback was triggered. This happends after `reactivateAfter` ms (default infinity) or with `foresightmanager.instance.reactivate(element)`.

```typescript
type ElementReactivatedEvent = {
  type: "elementReactivated"
  timestamp: number
  elementData: ForesightElementData
}
```

**Related Types:** [`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### <code style={{backgroundColor: '#1e293b', color: '#f97316', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>elementUnregistered</code>

Fired when an element is removed from `ForesightManager`'s tracking. This only happends when the element is removed from the `DOM` or via developer actions like `foresightmanar.instance.unregister(element)`

```typescript
type ElementUnregisteredEvent = {
  type: "elementUnregistered"
  timestamp: number
  elementData: ForesightElementData
  unregisterReason: "disconnected" | "apiCall" | "devtools" | (string & {})
  wasLastElement: boolean
}
```

**Related Types:** [`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

---

#### <code style={{backgroundColor: '#1e293b', color: '#f97316', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>elementDataUpdated</code>

Fired when tracked element data changes (bounds/visibility only). Does not fire on any updates regarding `callback` data.

```typescript
type ElementDataUpdatedEvent = {
  type: "elementDataUpdated"
  elementData: ForesightElementData
  updatedProps: UpdatedDataPropertyNames[] // "bounds" | "visibility"
}
```

**Related Types:** [`ForesightElementData`](/docs/getting_started/typescript#foresightelementdata)

### Prediction Events

Events fired during movement prediction calculations.

---

#### <code style={{backgroundColor: '#1e293b', color: '#8b5cf6', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>mouseTrajectoryUpdate</code>

Fired during mouse movement for trajectory calculations

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

#### <code style={{backgroundColor: '#1e293b', color: '#8b5cf6', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>scrollTrajectoryUpdate</code>

Fired during scroll events when scroll prediction is active

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

Events fired when ForesightManager configuration changes.

---

#### <code style={{backgroundColor: '#1e293b', color: '#f59e0b', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>managerSettingsChanged</code>

Fired when [global](/docs/next/getting_started/config#global-configuration) `ForesightManager` settings are updated via the [devtools](/docs/next/getting_started/development_tools) or via `foresightmanager.instance.alterGlobalSettings()`.

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

#### <code style={{backgroundColor: '#1e293b', color: '#f59e0b', padding: '4px 8px', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '600'}}>deviceStrategyChanged</code>

Fired when user switches from mouse+keyboard setup to pen/touch or vice versa.

```typescript
type ManagerSettingsChangedEvent = {
  type: "deviceStrategyChanged"
  timestamp: number
  newStrategy: CurrentDeviceStrategy
  oldStrategy: CurrentDeviceStrategy
}
```

---
