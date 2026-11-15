import type { Action } from "svelte/action"
import type { ForesightElementState, ForesightRegisterOptionsWithoutElement } from "js.foresight"

export type ForesightOptions = ForesightRegisterOptionsWithoutElement

export type ForesightResult = {
  /** Bind to one element at a time with `use:action`. */
  action: Action<HTMLElement>
  /** Immutable reactive snapshot. Read through the result to retain reactivity. */
  readonly state: Readonly<ForesightElementState>
}
