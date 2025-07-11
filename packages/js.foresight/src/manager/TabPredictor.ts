import { tabbable, type FocusableElement } from "tabbable"
import { getFocusedElementIndex } from "../helpers/getFocusedElementIndex"
import type { callCallbackFunction, ForesightElement, ForesightElementData } from "../types/types"

/**
 * Manages the prediction of user intent based on Tab key navigation.
 *
 * This class is a specialist module controlled by the ForesightManager.
 * Its responsibilities are:
 * - Listening for `keydown` and `focusin` events to detect tabbing.
 * - Caching the list of tabbable elements on the page for performance.
 * - Invalidating the cache when the DOM changes.
 * - Predicting which registered elements the user is about to focus.
 * - Calling a provided callback when a prediction is made.
 */
export class TabPredictor {
  // Internal state for tab prediction
  private lastKeyDown: KeyboardEvent | null = null
  private tabbableElementsCache: FocusableElement[] = []
  private lastFocusedIndex: number | null = null
  private tabAbortController: AbortController | null = null
  public tabOffset: number
  private elements: ReadonlyMap<ForesightElement, ForesightElementData>
  private callbackFunction: callCallbackFunction
  /**
   * Creates an instance of TabPredictor.
   * @param initialTabOffset - The initial tab offset setting.
   * @param elements - A reference to the manager's map of registered elements.
   */
  constructor(
    initialTabOffset: number,
    elements: Map<ForesightElement, ForesightElementData>,
    callbackFunction: callCallbackFunction
  ) {
    this.elements = elements
    this.initializeListeners()
    this.tabOffset = initialTabOffset
    this.callbackFunction = callbackFunction
  }

  private initializeListeners() {
    this.tabAbortController = new AbortController()
    const { signal } = this.tabAbortController
    document.addEventListener("keydown", this.handleKeyDown, { signal })
    document.addEventListener("focusin", this.handleFocusIn, { signal })
  }

  public invalidateCache() {
    this.tabbableElementsCache = []
    this.lastFocusedIndex = null
  }

  public cleanup() {
    if (this.tabAbortController) {
      this.tabAbortController.abort()
      this.tabAbortController = null
    }
  }

  // We store the last key for the FocusIn event, meaning we know if the user is tabbing around the page.
  // We dont use handleKeyDown for the full event because of 2 main reasons:
  // 1: handleKeyDown e.target returns the target on which the keydown is pressed (meaning we dont know which target got the focus)
  // 2: handleKeyUp does return the correct e.target however when holding tab the event doesnt repeat (handleKeyDown does)
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      this.lastKeyDown = e
    }
  }

  private handleFocusIn = (e: FocusEvent) => {
    if (!this.lastKeyDown) {
      return
    }
    const targetElement = e.target
    if (!(targetElement instanceof HTMLElement)) {
      return
    }

    // tabbable uses element.GetBoundingClientRect under the hood, to avoid alot of computations we cache its values
    if (!this.tabbableElementsCache.length) {
      this.tabbableElementsCache = tabbable(document.documentElement)
    }

    // Determine the range of elements to check based on the tab direction and offset
    const isReversed = this.lastKeyDown.shiftKey

    const currentIndex: number = getFocusedElementIndex(
      isReversed,
      this.lastFocusedIndex,
      this.tabbableElementsCache,
      targetElement
    )

    this.lastFocusedIndex = currentIndex

    this.lastKeyDown = null
    const elementsToPredict: ForesightElement[] = []
    for (let i = 0; i <= this.tabOffset; i++) {
      if (isReversed) {
        const element = this.tabbableElementsCache[currentIndex - i]
        if (this.elements.has(element as ForesightElement)) {
          elementsToPredict.push(element as ForesightElement)
        }
      } else {
        const element = this.tabbableElementsCache[currentIndex + i]
        if (this.elements.has(element as ForesightElement)) {
          elementsToPredict.push(element as ForesightElement)
        }
      }
    }

    elementsToPredict.forEach(element => {
      const elementData = this.elements.get(element)
      if (elementData) {
        console.log("here")
        this.callbackFunction(elementData, {
          kind: "tab",
          subType: isReversed ? "reverse" : "forwards",
        })
      }
    })
  }
}
