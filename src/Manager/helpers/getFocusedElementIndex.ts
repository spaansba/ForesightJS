import type { FocusableElement } from "tabbable"

/**
 * Finds the index of a focused element within a cache of tabbable elements.
 * It uses a predictive search for O(1) performance in the common case of
 * sequential tabbing, and falls back to a linear search O(n) if the
 * prediction fails.
 *
 * @param isReversed - True if the user is tabbing backward (Shift+Tab).
 * @param lastFocusedIndex - The index of the previously focused element, or null if none.
 * @param tabbableElementsCache - The array of all tabbable elements.
 * @param targetElement - The new HTML element that has received focus.
 * @returns The index of the targetElement in the cache, or -1 if not found.
 */
export function getFocusedElementIndex(
  isReversed: boolean,
  lastFocusedIndex: number | null,
  tabbableElementsCache: FocusableElement[],
  targetElement: HTMLElement
): number {
  let currentIndex: number = -1

  // --- Predictive Search (Fast Path) ---
  // First, try to predict the next index based on the last known position.
  if (lastFocusedIndex !== null) {
    const predictedIndex = isReversed ? lastFocusedIndex - 1 : lastFocusedIndex + 1

    // Check if the prediction is valid and correct.
    if (
      predictedIndex >= 0 &&
      predictedIndex < tabbableElementsCache.length &&
      tabbableElementsCache[predictedIndex] === targetElement
    ) {
      console.log("hit")
      // The prediction was correct! This is the O(1) success case.
      currentIndex = predictedIndex
    }
  }

  if (currentIndex === -1) {
    currentIndex = tabbableElementsCache.findIndex((element) => element === targetElement)
  }

  return currentIndex
}
