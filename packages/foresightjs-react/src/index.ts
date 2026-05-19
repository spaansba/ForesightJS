export {
  ForesightManager,
  type ForesightElementState,
  type ForesightRegisterOptionsWithoutElement,
  type ForesightCallback,
  type UpdateForsightManagerSettings,
  type ForesightManagerSettings,
  type ForesightEvent,
  type ForesightEventMap,
  type ElementRegisteredEvent,
  type ElementOptionsUpdatedEvent,
  type DeviceStrategyChangedEvent,
  type ElementReactivatedEvent,
  type ElementUnregisteredEvent,
  type ElementDataUpdatedEvent,
  type CallbackInvokedEvent,
  type CallbackCompletedEvent,
  type MouseTrajectoryUpdateEvent,
  type ScrollTrajectoryUpdateEvent,
  type ManagerSettingsChangedEvent,
  type HitSlop,
  type CallbackHitType,
  type CallbackHits,
  type TouchDeviceStrategy,
  type MinimumConnectionType,
} from "js.foresight"
export { useForesight } from "./hooks/useForesight"
export { useForesights } from "./hooks/useForesights"
export { useForesightEvent } from "./hooks/useForesightEvent"
