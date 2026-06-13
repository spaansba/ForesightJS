import type { Component, ComponentPublicInstance, MaybeRefOrGetter, ToRefs } from "vue"
import type {
  ForesightCallback,
  ForesightElementState,
  ForesightRegisterOptionsWithoutElement,
  HitSlop,
} from "js.foresight"

export type MaybeElement = Element | ComponentPublicInstance | null | undefined

export type MaybeElementRef = MaybeRefOrGetter<MaybeElement>

export type ResolvedElement<T extends MaybeElement> = T extends ComponentPublicInstance
  ? Exclude<MaybeElement, ComponentPublicInstance>
  : T | undefined

export type ForesightOptions = ForesightRegisterOptionsWithoutElement

export type ForesightResult = ToRefs<Readonly<ForesightElementState>> & {
  /** Template ref function - bind to an element with `:ref="elementRef"`. */
  elementRef: (el: MaybeElement) => void
}

/**
 * Component form of the registration options. The foresight `name` option is
 * exposed as `foresightName` so the HTML `name` attribute (on `input`,
 * `button`, `select`, ...) can be forwarded to the element in the `as` form.
 */
export type ForesightComponentOptions = Omit<ForesightOptions, "name"> & {
  foresightName?: string
}

/**
 * Default-slot props: the reactive element state plus the `elementRef` to
 * attach. In the render-prop form bind it yourself (`:ref="elementRef"`); in
 * the `as` form it is already bound to the rendered element.
 */
export type ForesightSlotProps = Readonly<ForesightElementState> & {
  elementRef: ForesightResult["elementRef"]
}

/**
 * Props for the `Foresight` component. Shared by the component's `defineProps`
 * and its public type, so the prop shape has a single source of truth.
 */
export interface ForesightProps {
  /** Render this tag or component itself instead of using the render-prop form. */
  as?: string | Component
  callback: ForesightCallback
  foresightName?: string
  hitSlop?: HitSlop
  meta?: Record<string, unknown>
  reactivateAfter?: number
  enabled?: boolean
}

/** @deprecated Use {@link ForesightOptions} instead. */
export type UseForesightOptions = ForesightOptions

/** @deprecated Use {@link ForesightResult} instead. */
export type UseForesightReturn = ForesightResult
