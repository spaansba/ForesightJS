import { ForesightManager } from "js.foresight"
import type { ForesightRegisterOptionsWithoutElement, ForesightRegisterResult } from "js.foresight"

/**
 * Escape hatch for options that can't be expressed as data attributes
 * (custom callbacks, `meta`). Thin wrapper over
 * `ForesightManager.instance.register` for use in `<script>` tags.
 */
export const registerForesight = (
  target: string | Element,
  options: ForesightRegisterOptionsWithoutElement
): ForesightRegisterResult[] => {
  const elements =
    typeof target === "string" ? Array.from(document.querySelectorAll(target)) : [target]

  return elements.map(element => ForesightManager.instance.register({ element, ...options }))
}
