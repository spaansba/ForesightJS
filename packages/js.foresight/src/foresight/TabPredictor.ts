import { tabbable, type FocusableElement } from "tabbable"
import { getFocusedElementIndex } from "../helpers/getFocusedElementIndex"
import type { ForesightElement } from "../types/types"
import { BasePredictor, type BasePredictorConfig } from "./BasePredictor"

export interface TabPredictorSettings {
  tabOffset: number
}

export interface TabPredictorConfig extends BasePredictorConfig {
  settings: TabPredictorSettings
}

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
export class TabPredictor extends BasePredictor {
  // Internal state for tab prediction
  private lastKeyDown: KeyboardEvent | null = null
  private tabbableElementsCache: FocusableElement[] = []
  private lastFocusedIndex: number | null = null
  public tabOffset: number

  constructor(config: TabPredictorConfig) {
    super(config)
    this.tabOffset = config.settings.tabOffset
    this.initializeListeners()
  }

  protected initializeListeners(): void {
    const { signal } = this.abortController
    document.addEventListener("keydown", this.handleKeyDown, { signal })
    document.addEventListener("focusin", this.handleFocusIn, { signal })
  }

  public invalidateCache() {
    this.tabbableElementsCache = []
    this.lastFocusedIndex = null
  }

  public cleanup(): void {
    this.abort()
    this.tabbableElementsCache = []
    this.lastFocusedIndex = null
    this.lastKeyDown = null
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
    try {
      if (!this.lastKeyDown) {
        return
      }
      const targetElement = e.target
      if (!(targetElement instanceof HTMLElement)) {
        return
      }

      // tabbable uses element.GetBoundingClientRect under the hood, to avoid alot of computations we cache its values
      if (!this.tabbableElementsCache.length || this.lastFocusedIndex === -1) {
        this.tabbableElementsCache = tabbable(document.documentElement)
      }

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
        const elementIndex = isReversed ? currentIndex - i : currentIndex + i
        const element = this.tabbableElementsCache[elementIndex]

        // Type guard: ensure element exists and is a valid ForesightElement
        if (element && element instanceof Element && this.elements.has(element)) {
          elementsToPredict.push(element)
        }
      }
      for (const element of elementsToPredict) {
        const elementData = this.elements.get(element)
        if (
          elementData &&
          !elementData.callbackInfo.isRunningCallback &&
          elementData.callbackInfo.isCallbackActive
        ) {
          this.callCallback(elementData, {
            kind: "tab",
            subType: isReversed ? "reverse" : "forwards",
          })
        }
      }
    } catch (error) {
      this.handleError(error, "handleFocusIn")
    }
  }
}
