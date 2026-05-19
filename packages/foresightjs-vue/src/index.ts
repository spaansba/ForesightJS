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
  type DeviceStrategyChangedEvent,
  type ElementUnregisteredEvent,
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
export { useForesight, type UseForesightReturn } from "./composables/useForesight"
export { useForesights, type UseForesightSlot } from "./composables/useForesights"
export { useForesightEvent } from "./composables/useForesightEvent"
export { vForesight } from "./directives/vForesight"
