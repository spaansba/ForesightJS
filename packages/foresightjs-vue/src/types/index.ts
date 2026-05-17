import type { ComponentPublicInstance, MaybeRefOrGetter } from "vue"

export type MaybeElement = HTMLElement | SVGElement | ComponentPublicInstance | null | undefined

export type MaybeElementRef = MaybeRefOrGetter<MaybeElement>

export type ResolvedElement<T extends MaybeElement> = T extends ComponentPublicInstance
  ? Exclude<MaybeElement, ComponentPublicInstance>
  : T | undefined
