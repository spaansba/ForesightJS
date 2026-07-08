import type { ForesightElementState } from "../types/types"

/**
 * Whether an element takes part in the per-pointer-move trajectory scan.
 * Mirrors the guard MousePredictor used to run inline for every registered
 * element; membership is now precomputed into a set so the scan iterates only
 * these elements instead of the full registry. Keep this in sync with that scan.
 */
export const isScannable = (state: ForesightElementState): boolean =>
  state.isIntersectingWithViewport && state.isActive && !state.isPredicted
