import type { ForesightElementState, ForesightRegisterOptionsWithoutElement } from "js.foresight"

export type UseForesightOptions = ForesightRegisterOptionsWithoutElement & {
  /**
   * Set to `false` to prevent the element from being registered with ForesightManager.
   * When disabled, the hook returns the unregistered initial snapshot.
   * When toggled back to `true`, the element is registered again.
   *
   * @default true
   */
  enabled?: boolean
}

export type UseForesightResult<T extends HTMLElement> = ForesightElementState & {
  elementRef: (node: T | null) => void
}
