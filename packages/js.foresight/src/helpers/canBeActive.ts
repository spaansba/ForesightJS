import type { ForesightElementState } from "../types/types"

/**
 * Whether an element is allowed to be active (observed and able to fire).
 * Single gate for every activation path: register, enable, reactivate and
 * DOM reconnect. Disabled, limited-connection and parked elements stay inactive.
 */
export const canBeActive = (
  state: Pick<ForesightElementState, "isEnabled" | "isLimitedConnection" | "isParked">
): boolean => state.isEnabled && !state.isLimitedConnection && !state.isParked
