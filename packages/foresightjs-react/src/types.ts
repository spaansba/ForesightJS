import type { ForesightElementState, ForesightRegisterOptionsWithoutElement } from "js.foresight"

export type UseForesightOptions = ForesightRegisterOptionsWithoutElement

export type UseForesightResult<T extends HTMLElement> = ForesightElementState & {
  elementRef: (node: T | null) => void
}
