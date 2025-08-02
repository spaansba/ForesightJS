import { tabbable, type FocusableElement } from "tabbable"
import { getFocusedElementIndex } from "../helpers/getFocusedElementIndex"
import type { ForesightElement } from "../types/types"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"

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
export class TabPredictor extends BaseForesightModule {
  protected readonly moduleName = "TabPredictor"

  // Internal state for tab prediction
  private lastKeyDown: KeyboardEvent | null = null
  private tabbableElementsCache: FocusableElement[] = []
  private lastFocusedIndex: number | null = null

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
  }

  public invalidateCache() {
    this.tabbableElementsCache = []
    this.lastFocusedIndex = null
  }

  protected onConnect(): void {
    this.createAbortController()

    document.addEventListener("keydown", this.handleKeyDown, {
      signal: this.abortController?.signal,
      passive: true,
    })

    document.addEventListener("focusin", this.handleFocusIn, {
      signal: this.abortController?.signal,
      passive: true,
    })
  }

  protected onDisconnect(): void {
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
    const tabOffset = this.settings.tabOffset
    const currentElements = this.elements

    for (let i = 0; i <= tabOffset; i++) {
      const elementIndex = isReversed ? currentIndex - i : currentIndex + i
      const element = this.tabbableElementsCache[elementIndex]

      // Type guard: ensure element exists and is a valid ForesightElement
      if (element && element instanceof Element && currentElements.has(element)) {
        elementsToPredict.push(element)
      }
    }

    for (const element of elementsToPredict) {
      const elementData = currentElements.get(element)

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
  }
}
