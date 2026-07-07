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
  type ForesightDirectiveValue,
  type ForesightStateSignal,
  type ForesightRegistration,
} from "./types"
export { ForesightDirective } from "./directives/ForesightDirective"
export { ForesightComponent } from "./components/ForesightComponent"
export { ForesightService } from "./services/ForesightService"
export { injectForesightEvent } from "./helpers/injectForesightEvent"
