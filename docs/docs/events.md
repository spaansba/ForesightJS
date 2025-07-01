# Events

ForesightManager emits various events during its operation to provide insight into element registration, prediction activities, and callback executions. These events are primarily used by the [ForesightJS DevTools](https://github.com/spaansba/ForesightJS-DevTools) for visual debugging and monitoring, but can also be leveraged for telemetry, analytics, and performance monitoring in your applications.

## Usage

All events can be listened to using the standard `addEventListener` pattern on the ForesightManager instance:

```typescript
import { ForesightManager } from 'js.foresight'

const manager = ForesightManager.initialize(/* your config */)

// Listen to any event
manager.addEventListener('eventName', (event) => {
  console.log('Event fired:', event)
})

// Example: Monitor callback performance
manager.addEventListener('callbackFired', (event) => {
  console.log(`Callback executed for ${event.elementData.name} in ${event.hitType.kind} mode`)
})
```

## Available Events

### Element Lifecycle Events

#### `elementRegistered`

Fired when an element is successfully registered with ForesightManager.

```typescript
interface ElementRegisteredEvent {
  type: 'elementRegistered'
  timestamp: number
  elementData: ForesightElementData
}
```

**Use cases**: Track registration patterns, monitor element setup, telemetry

---

#### `elementUnregistered`

Fired when an element is removed from ForesightManager tracking.

```typescript
interface ElementUnregisteredEvent {
  type: 'elementUnregistered'
  timestamp: number
  elementData: ForesightElementData
  unregisterReason: 'callbackHit' | 'disconnected' | 'apiCall'
}
```

**Unregister reasons**:
- `callbackHit`: Element was automatically unregistered after its callback fired
- `disconnected`: Element was removed from the DOM
- `apiCall`: Manually unregistered via `manager.unregister()`

**Use cases**: Debug element lifecycle, track why elements are being removed

---

#### `elementDataUpdated`

Fired when tracked element data changes (bounds or visibility).

```typescript
interface ElementDataUpdatedEvent {
  type: 'elementDataUpdated'
  timestamp: number
  elementData: ForesightElementData
  updatedProp: 'bounds' | 'visibility'
}
```

**Use cases**: Monitor element position changes, viewport intersection tracking

---

### Interaction Events

#### `callbackFired`

Fired when an element's callback is executed due to user interaction prediction or actual interaction.

```typescript
interface CallbackFiredEvent {
  type: 'callbackFired'
  timestamp: number
  elementData: ForesightElementData
  hitType: HitType
  managerData: ForesightManagerData
}
```

**HitType structure**:
```typescript
type HitType = 
  | { kind: 'mouse'; subType: 'hover' | 'trajectory' }
  | { kind: 'tab'; subType: 'forwards' | 'reverse' }
  | { kind: 'scroll'; subType: 'up' | 'down' | 'left' | 'right' }
```

**Use cases**: Performance monitoring, analytics, success rate tracking

---

### Prediction Events

#### `mouseTrajectoryUpdate`

Fired during mouse movement when trajectory prediction is active.

```typescript
interface MouseTrajectoryUpdateEvent {
  type: 'mouseTrajectoryUpdate'
  timestamp: number
  trajectoryPositions: {
    currentPoint: { x: number; y: number }
    predictedPoint: { x: number; y: number }
  }
  predictionEnabled: boolean
}
```

**Use cases**: Visual debugging, trajectory analysis, performance tuning

---

#### `scrollTrajectoryUpdate`

Fired during scroll events when scroll prediction is active.

```typescript
interface ScrollTrajectoryUpdateEvent {
  type: 'scrollTrajectoryUpdate'
  timestamp: number
  currentPoint: { x: number; y: number }
  predictedPoint: { x: number; y: number }
}
```

**Use cases**: Scroll prediction debugging, performance analysis

---

### Configuration Events

#### `managerSettingsChanged`

Fired when global ForesightManager settings are updated.

```typescript
interface ManagerSettingsChangedEvent {
  type: 'managerSettingsChanged'
  timestamp: number
  newSettings: ForesightManagerSettings
}
```

**Use cases**: Debug configuration changes, track setting modifications

---

## Event Listener Management

### Adding Listeners

```typescript
const handleCallback = (event: CallbackFiredEvent) => {
  // Handle the event
}

manager.addEventListener('callbackFired', handleCallback)
```

### Removing Listeners

```typescript
manager.removeEventListener('callbackFired', handleCallback)
```

### Multiple Event Types

```typescript
// Listen to multiple events
const events = ['elementRegistered', 'elementUnregistered', 'callbackFired'] as const

events.forEach(eventType => {
  manager.addEventListener(eventType, (event) => {
    console.log(`${eventType}:`, event)
  })
})
```

## Common Use Cases

### Performance Monitoring

```typescript
manager.addEventListener('callbackFired', (event) => {
  // Track callback performance
  analytics.track('foresight_callback', {
    elementName: event.elementData.name,
    hitType: event.hitType.kind,
    timestamp: event.timestamp
  })
})
```

### Debug Element Registration

```typescript
let registrationCount = 0

manager.addEventListener('elementRegistered', (event) => {
  registrationCount++
  console.log(`Registered element #${registrationCount}:`, event.elementData.name)
})

manager.addEventListener('elementUnregistered', (event) => {
  registrationCount--
  console.log(`Unregistered element (${event.unregisterReason}):`, event.elementData.name)
})
```

### Trajectory Analysis

```typescript
let trajectoryData: Array<{x: number, y: number, timestamp: number}> = []

manager.addEventListener('mouseTrajectoryUpdate', (event) => {
  trajectoryData.push({
    ...event.trajectoryPositions.predictedPoint,
    timestamp: event.timestamp
  })
  
  // Keep only last 100 points
  if (trajectoryData.length > 100) {
    trajectoryData = trajectoryData.slice(-100)
  }
})
```

## TypeScript Support

All events are fully typed when using TypeScript:

```typescript
import type { 
  CallbackFiredEvent, 
  ElementRegisteredEvent,
  MouseTrajectoryUpdateEvent 
} from 'js.foresight'

manager.addEventListener('callbackFired', (event: CallbackFiredEvent) => {
  // event is fully typed
  console.log(event.elementData.name)
  console.log(event.hitType.kind)
})
```