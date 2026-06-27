import type {
  ForesightCallback,
  ForesightElementState,
  ForesightRegisterOptionsWithoutElement,
  HitSlop,
} from "js.foresight"
import type { Signal } from "@angular/core"

export type ForesightOptions = ForesightRegisterOptionsWithoutElement

export type ForesightDirectiveValue = ForesightOptions | ForesightCallback | null | undefined

export type ForesightStateSignal = Signal<Readonly<ForesightElementState>>

export type ForesightRegistration = {
  readonly state: ForesightStateSignal
  update: (options: ForesightOptions) => void
  unregister: () => void
  getSnapshot: () => ForesightElementState
}

/**
 * Component/directive form of the registration options. The foresight `name`
 * option is exposed as `foresightName` so an element's native `name` attribute
 * can still be used independently.
 */
export type ForesightComponentOptions = Omit<ForesightOptions, "name"> & {
  foresightName?: string
}

export type ForesightDirectiveInputs = {
  value: ForesightDirectiveValue
  name?: string
  hitSlop?: HitSlop
  meta?: Record<string, unknown>
  reactivateAfter?: number
  enabled?: boolean
}

/** @deprecated Use {@link ForesightOptions} instead. */
export type UseForesightOptions = ForesightOptions

/** @deprecated Use {@link ForesightRegistration} instead. */
export type UseForesightReturn = ForesightRegistration
