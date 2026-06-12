import type { ForesightElementState, ForesightRegisterOptionsWithoutElement } from "js.foresight"

export type ForesightOptions = ForesightRegisterOptionsWithoutElement

export type ForesightResult<T extends HTMLElement> = ForesightElementState & {
  elementRef: (node: T | null) => void
}

/** @deprecated Use {@link ForesightOptions} instead. */
export type UseForesightOptions = ForesightOptions

/** @deprecated Use {@link ForesightResult} instead. */
export type UseForesightResult<T extends HTMLElement> = ForesightResult<T>
