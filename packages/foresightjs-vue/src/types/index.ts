import type { ComponentPublicInstance, MaybeRefOrGetter, ToRefs } from "vue"
import type { ForesightElementState, ForesightRegisterOptionsWithoutElement } from "js.foresight"

export type MaybeElement = Element | ComponentPublicInstance | null | undefined

export type MaybeElementRef = MaybeRefOrGetter<MaybeElement>

export type ResolvedElement<T extends MaybeElement> = T extends ComponentPublicInstance
  ? Exclude<MaybeElement, ComponentPublicInstance>
  : T | undefined

export type UseForesightOptions = ForesightRegisterOptionsWithoutElement

export type UseForesightReturn = ToRefs<Readonly<ForesightElementState>> & {
  /** Template ref function - bind to an element with `:ref="setRef"`. */
  setRef: (el: MaybeElement) => void
}
