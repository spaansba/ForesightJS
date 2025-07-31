---
sidebar_position: 4
keywords:
  - ForesightJS
  - JS.Foresight
  - Typescript
description: Typescript helpers for the ForesightJS library
last_updated:
  date: 2025-06-04
  author: Bart Spaans
---

# TypeScript

ForesightJS is fully written in `TypeScript` to make sure your development experience is as good as possbile.

## Most Used Internal types

### ForesightElementData

This is the main type used in ForesightJS as it gathers all information about a registered element. `ForesightElementData` is returned in most [events](/docs/events) as `elementData`

```TS
type ForesightElementData = {
  callback: ForesightCallback // () => void
  name: string
  id: string // only for internals
  elementBounds: {
    originalRect: DOMRectReadOnly
    hitSlop: Exclude<HitSlop, number>
    expandedRect: Readonly<Rect> // originalRect + hitSlop
  }
  trajectoryHitData: TrajectoryHitData // only for internals
  isIntersectingWithViewport: boolean
  element: ForesightElement
  registerCount: number //Amount of times this element has been (re)registered.
  meta: Record<string, unknown>
  callbackInfo: {
    callbackFiredCount: number
    lastCallbackInvokedAt: number | undefined
    lastCallbackCompletedAt: number | undefined
    lastCallbackRuntime: number | undefined
    lastCallbackStatus: callbackStatus
    lastCallbackErrorMessage: string | undefined | null
    reactivateAfter: number
    isCallbackActive: boolean
    isRunningCallback: boolean
    reactivateTimeoutId?: ReturnType<typeof setTimeout>
  }
}
```

### CallbackHitType

```typescript
type CallbackHitType =
  | { kind: "mouse"; subType: "hover" | "trajectory" }
  | { kind: "tab"; subType: "forwards" | "reverse" }
  | { kind: "scroll"; subType: "up" | "down" | "left" | "right" }
```

### ForesightManagerData

Snapshot of the current ForesightManager state, including all [global settings](/docs/configuration/global-settings), registered elements, position observer data, and interaction statistics. This is primarily used for debugging, monitoring, and development purposes.

This data is returned in the [`managerSettingsChanged`](/docs/events) event or by calling [`ForesightManager.instance.getManagerData`](/docs/debugging/static-properties#foresightmanagerinstancegetmanagerdata) manually.

```TS
type ForesightManagerData = {
  registeredElements: ReadonlyMap<ForesightElement, ForesightElementData> // See above for ForesightElementData
  globalSettings: Readonly<ForesightManagerSettings> // See configuration for global settings
  globalCallbackHits: Readonly<CallbackHits> // See above for CallbackHitType, this is that but all of them combined
  eventListeners: ReadonlyMap<keyof ForesightEventMap, ForesightEventListener[]> // All event listeners currently listening
}
```

## Helper Types

### ForesightRegisterOptionsWithoutElement

Usefull for if you want to create a custom button component in a modern framework (for example React). And you want to have the `ForesightRegisterOptions` used in `ForesightManager.instance.register({})` without the element as the element will be the ref of the component.

This type is used in the [`useForesight`](/docs/integrations/react/useForesight) hook for React.

```typescript
type ForesightButtonProps = {
  registerOptions: ForesightRegisterOptionsWithoutElement
}
```
