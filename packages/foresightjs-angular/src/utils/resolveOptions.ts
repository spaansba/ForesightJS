import type { ForesightCallback } from "js.foresight"
import type { ForesightDirectiveInputs, ForesightDirectiveValue, ForesightOptions } from "../types"

const isCallbackShorthand = (value: ForesightDirectiveValue): value is ForesightCallback =>
  typeof value === "function"

const hasValue = <T>(value: T | undefined): value is T => value !== undefined

export const resolveOptions = ({
  value,
  name,
  hitSlop,
  meta,
  reactivateAfter,
  enabled,
}: ForesightDirectiveInputs): ForesightOptions | null => {
  if (!value) {
    return null
  }

  const base = isCallbackShorthand(value) ? { callback: value } : value

  return {
    ...base,
    ...(hasValue(name) ? { name } : {}),
    ...(hasValue(hitSlop) ? { hitSlop } : {}),
    ...(hasValue(meta) ? { meta } : {}),
    ...(hasValue(reactivateAfter) ? { reactivateAfter } : {}),
    ...(hasValue(enabled) ? { enabled } : {}),
  }
}
