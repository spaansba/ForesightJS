import type { ComponentPublicInstance, MaybeRefOrGetter, ToRefs } from "vue"
import type { ForesightElementState, ForesightRegisterOptionsWithoutElement } from "js.foresight"

export type MaybeElement = Element | ComponentPublicInstance | null | undefined

export type MaybeElementRef = MaybeRefOrGetter<MaybeElement>

export type ResolvedElement<T extends MaybeElement> = T extends ComponentPublicInstance
  ? Exclude<MaybeElement, ComponentPublicInstance>
  : T | undefined

export type UseForesightOptions = ForesightRegisterOptionsWithoutElement & {
  /**
   * Set to `false` to prevent the element from being registered with ForesightManager.
   * When disabled, the composable returns the unregistered initial snapshot.
   * When toggled back to `true`, the element is registered again.
   *
   * @default true
   */
  enabled?: boolean
}

export type UseForesightReturn = ToRefs<Readonly<ForesightElementState>> & {
  /** Template ref function - bind to an element with `:ref="setRef"`. */
  setRef: (el: MaybeElement) => void
}
