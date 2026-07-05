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

export type ForesightDirectiveInputs = {
  value: ForesightDirectiveValue
  name?: string
  hitSlop?: HitSlop
  meta?: Record<string, unknown>
  reactivateAfter?: number
  enabled?: boolean
}
