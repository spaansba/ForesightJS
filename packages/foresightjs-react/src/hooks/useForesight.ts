import type { ForesightOptions, ForesightResult } from "../types"
import { useForesightRegistration } from "./useForesightRegistration"
import { useForesightState } from "./useForesightState"

export const useForesight = <T extends HTMLElement = HTMLElement>(
  options: ForesightOptions
): ForesightResult<T> => {
  const { elementRef, registerResults } = useForesightRegistration<T>(options)
  const state = useForesightState(registerResults, true)

  return { elementRef, ...state }
}
