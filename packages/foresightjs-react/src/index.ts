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
export {
  type ForesightOptions,
  type ForesightResult,
  type UseForesightOptions,
  type UseForesightResult,
} from "./types"
export { useForesight } from "./hooks/useForesight"
export {
  Foresight,
  type ForesightProps,
  type ForesightAsProps,
  type ForesightComponentOptions,
} from "./components/Foresight"
export { useForesightEvent } from "./hooks/useForesightEvent"
