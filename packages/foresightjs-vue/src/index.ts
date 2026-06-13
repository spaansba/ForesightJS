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
import type { DefineSetupFnComponent, SlotsType } from "vue"
import ForesightImpl from "./components/Foresight.vue"
import type { ForesightProps, ForesightSlotProps } from "./types"

export {
  type ForesightOptions,
  type ForesightResult,
  type ForesightComponentOptions,
  type ForesightProps,
  type ForesightSlotProps,
  type UseForesightOptions,
  type UseForesightReturn,
} from "./types"
export { useForesight } from "./composables/useForesight"

/**
 * The bundled `.d.ts` for a `<script setup>` SFC can't infer the component's
 * prop types (they collapse to `any`), so re-export it cast to an explicit type
 * built from the shared `ForesightProps` and slot props.
 */
export const Foresight = ForesightImpl as unknown as DefineSetupFnComponent<
  ForesightProps,
  [],
  SlotsType<{ default?: (props: ForesightSlotProps) => unknown }>
>
export { useForesightEvent } from "./composables/useForesightEvent"
export { vForesight } from "./directives/vForesight"
