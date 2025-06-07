import { tabbable } from "tabbable"
import type {
  BooleanSettingKeys,
  ForesightElement,
  ForesightElementData,
  ForesightManagerProps,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  MousePosition,
  NumericSettingKeys,
  Point,
  UpdateForsightManagerProps,
} from "../../types/types"
import { ForesightDebugger } from "../Debugger/ForesightDebugger"
import { isTouchDevice } from "../helpers/isTouchDevice"
import { lineSegmentIntersectsRect } from "../helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "../helpers/predictNextMousePosition"
import {
  areRectsEqual,
  getExpandedRect,
  isPointInRectangle,
  normalizeHitSlop,
} from "../helpers/rectAndHitSlop"
import { clampNumber } from "../helpers/clampNumber"
import {
  DEFAULT_ENABLE_MOUSE_PREDICTION,
  DEFAULT_ENABLE_TAB_PREDICTION,
  DEFAULT_HITSLOP,
  DEFAULT_IS_DEBUG,
  DEFAULT_IS_DEBUGGER_MINIMIZED,
  DEFAULT_POSITION_HISTORY_SIZE,
  DEFAULT_RESIZE_SCROLL_THROTTLE_DELAY,
  DEFAULT_TAB_OFFSET,
  DEFAULT_TRAJECTORY_PREDICTION_TIME,
  MAX_POSITION_HISTORY_SIZE,
  MAX_RESIZE_SCROLL_THROTTLE_DELAY,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_RESIZE_SCROLL_THROTTLE_DELAY,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "../constants"

import { shouldUpdateSetting } from "../helpers/shouldUpdateSetting"

/**
 * Manages the prediction of user intent based on mouse trajectory and element interactions.
 *
 * ForesightManager is a singleton class responsible for:
 * - Registering HTML elements to monitor.
 * - Tracking mouse movements and predicting future cursor positions.
 * - Detecting when a predicted trajectory intersects with a registered element's bounds.
 * - Invoking callbacks associated with elements upon predicted or actual interaction.
 * - Optionally unregistering elements after their callback is triggered.
 * - Handling global settings for prediction behavior (e.g., history size, prediction time).
 * - Optionally enabling a {@link ForesightDebugger} for visual feedback.
 * - Automatically updating element bounds on resize using {@link ResizeObserver}.
 * - Automatically unregistering elements removed from the DOM using {@link MutationObserver}.
 * - Detecting broader layout shifts via {@link MutationObserver} to update element positions.
 *
 * It should be initialized once using {@link ForesightManager.initialize} and then
 * accessed via the static getter {@link ForesightManager.instance}.
 */

export class ForesightManager {
  private static manager: ForesightManager
  private elements: Map<ForesightElement, ForesightElementData> = new Map()

  private isSetup: boolean = false
  private debugger: ForesightDebugger | null = null

  private _globalSettings: ForesightManagerProps = {
    debug: DEFAULT_IS_DEBUG,
    enableMousePrediction: DEFAULT_ENABLE_MOUSE_PREDICTION,
    positionHistorySize: DEFAULT_POSITION_HISTORY_SIZE,
    trajectoryPredictionTime: DEFAULT_TRAJECTORY_PREDICTION_TIME,
    defaultHitSlop: {
      top: DEFAULT_HITSLOP,
      left: DEFAULT_HITSLOP,
      right: DEFAULT_HITSLOP,
      bottom: DEFAULT_HITSLOP,
    },
    resizeScrollThrottleDelay: DEFAULT_RESIZE_SCROLL_THROTTLE_DELAY,
    debuggerSettings: {
      isControlPanelDefaultMinimized: DEFAULT_IS_DEBUGGER_MINIMIZED,
    },
    enableTabPrediction: DEFAULT_ENABLE_TAB_PREDICTION,
    tabOffset: DEFAULT_TAB_OFFSET,
  }

  private positions: MousePosition[] = []
  private currentPoint: Point = { x: 0, y: 0 }
  private predictedPoint: Point = { x: 0, y: 0 }

  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null

  private domObserver: MutationObserver | null = null
  private domMutationRectsUpdateTimeoutId: ReturnType<typeof setTimeout> | null = null
  private elementIntersectionObserver: IntersectionObserver | null = null
  private elementResizeObserver: ResizeObserver | null = null

  // Track the last keydown event to determine if focus change was due to Tab
  private lastKeyDown: KeyboardEvent | null = null

  // AbortController for managing global event listeners
  private globalListenersController: AbortController | null = null

  private constructor() {}

  public static initialize(props?: Partial<UpdateForsightManagerProps>): ForesightManager {
    if (!this.isInitiated) {
      ForesightManager.manager = new ForesightManager()
    }
    if (props !== undefined) {
      ForesightManager.manager.alterGlobalSettings(props)
    }
    return ForesightManager.manager
  }

  public static get isInitiated(): Readonly<boolean> {
    if (!ForesightManager.manager) {
      return false
    }
    return true
  }

  public static get instance() {
    return this.initialize()
  }

  public get globalSettings(): Readonly<ForesightManagerProps> {
    return this._globalSettings
  }

  public get registeredElements(): ReadonlyMap<ForesightElement, ForesightElementData> {
    return this.elements
  }

  public register({
    element,
    callback,
    hitSlop,
    unregisterOnCallback,
    name,
  }: ForesightRegisterOptions): ForesightRegisterResult {
    if (isTouchDevice()) {
      return { isTouchDevice: true, unregister: () => {} }
    }

    const normalizedHitSlop = hitSlop
      ? normalizeHitSlop(hitSlop, this._globalSettings.debug)
      : this._globalSettings.defaultHitSlop

    if (this.elementIntersectionObserver) {
      this.elementIntersectionObserver.observe(element)
    }

    const elementData: ForesightElementData = {
      callback,
      elementBounds: {
        expandedRect: { top: 0, bottom: 0, left: 0, right: 0 },
        hitSlop: normalizedHitSlop,
      },
      isHovering: false,
      trajectoryHitData: {
        isTrajectoryHit: false,
        trajectoryHitTime: 0,
        trajectoryHitExpirationTimeoutId: undefined,
      },
      name: name ?? "",
      unregisterOnCallback: unregisterOnCallback ?? true,
      isIntersectingWithViewport: false,
    }
    this.elements.set(element, elementData)

    // Setup global listeners on every first element added to the manager. It gets removed again when the map is emptied
    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    if (this.debugger) {
      const data = this.elements.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
      this.debugger.refreshDisplayedElements()
    }

    return { isTouchDevice: false, unregister: () => this.unregister(element) }
  }

  private unregister(element: ForesightElement) {
    const isRegistered = this.elements.has(element)
    if (!isRegistered) {
      // The element is already unregistered by something else (e.g. after hitting callback)
      return
    }
    const foresightElementData = this.elements.get(element)

    // Clear any pending trajectory expiration timeout
    if (foresightElementData?.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
      clearTimeout(foresightElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
    }

    if (this.elementResizeObserver) {
      this.elementResizeObserver.unobserve(element)
    }

    if (this.elementIntersectionObserver) {
      this.elementIntersectionObserver.unobserve(element)
    }

    this.elements.delete(element)

    if (this.debugger) {
      this.debugger.removeLinkOverlay(element)
      this.debugger.refreshDisplayedElements()
    }

    if (this.elements.size === 0 && this.isSetup) {
      if (!this.debugger) {
        this.removeGlobalListeners()
      } else {
        console.log(
          "%cForesightJS: All elements have successfully been unregistered. ForesightJS would typically perform cleanup actions now, but these are currently skipped while in debug mode.",
          "color: #28a745; font-weight: bold;"
        )
      }
    }
  }

  private updateNumericSettings<K extends NumericSettingKeys>(
    newValue: number | undefined,
    name: K,
    min: number,
    max: number
  ) {
    if (!shouldUpdateSetting(newValue, this._globalSettings[name])) {
      return false
    }

    this._globalSettings[name] = clampNumber(newValue, min, max, this._globalSettings.debug, name)

    return true
  }

  private updateBooleanSetting<K extends BooleanSettingKeys>(
    newValue: boolean | undefined,
    name: K
  ): boolean {
    if (!shouldUpdateSetting(newValue, this._globalSettings[name])) {
      return false
    }
    this._globalSettings[name] = newValue
    return true
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerProps>): void {
    // Call each update function and store whether it made a change.
    // This ensures every update function is executed.
    const oldPositionHistorySize = this._globalSettings.positionHistorySize
    const positionHistoryChanged = this.updateNumericSettings(
      props?.positionHistorySize,
      "positionHistorySize",
      MIN_POSITION_HISTORY_SIZE,
      MAX_POSITION_HISTORY_SIZE
    )

    if (
      positionHistoryChanged &&
      this._globalSettings.positionHistorySize < oldPositionHistorySize
    ) {
      if (this.positions.length > this._globalSettings.positionHistorySize) {
        this.positions = this.positions.slice(
          this.positions.length - this._globalSettings.positionHistorySize
        )
      }
    }

    const trajectoryTimeChanged = this.updateNumericSettings(
      props?.trajectoryPredictionTime,
      "trajectoryPredictionTime",
      MIN_TRAJECTORY_PREDICTION_TIME,
      MAX_TRAJECTORY_PREDICTION_TIME
    )

    const tabOffsetChanged = this.updateNumericSettings(
      props?.tabOffset,
      "tabOffset",
      MIN_TAB_OFFSET,
      MAX_TAB_OFFSET
    )

    const throttleDelayChanged = this.updateNumericSettings(
      props?.resizeScrollThrottleDelay,
      "resizeScrollThrottleDelay",
      MIN_RESIZE_SCROLL_THROTTLE_DELAY,
      MAX_RESIZE_SCROLL_THROTTLE_DELAY
    )

    const mousePredictionChanged = this.updateBooleanSetting(
      props?.enableMousePrediction,
      "enableMousePrediction"
    )

    const tabPredictionChanged = this.updateBooleanSetting(
      props?.enableTabPrediction,
      "enableTabPrediction"
    )

    let debuggerSettingsChanged = false
    if (props?.debuggerSettings?.isControlPanelDefaultMinimized !== undefined) {
      this._globalSettings.debuggerSettings.isControlPanelDefaultMinimized =
        props.debuggerSettings.isControlPanelDefaultMinimized
      debuggerSettingsChanged = true
    }

    let hitSlopChanged = false
    if (props?.defaultHitSlop !== undefined) {
      const normalizedNewHitSlop = normalizeHitSlop(
        props.defaultHitSlop,
        this._globalSettings.debug
      )
      if (!areRectsEqual(this._globalSettings.defaultHitSlop, normalizedNewHitSlop)) {
        this._globalSettings.defaultHitSlop = normalizedNewHitSlop
        hitSlopChanged = true
        this.forceUpdateAllElementBounds()
      }
    }

    let debugModeChanged = false
    if (props?.debug !== undefined && this._globalSettings.debug !== props.debug) {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        this._globalSettings.debug = props.debug
        debugModeChanged = true
        if (this._globalSettings.debug) {
          this.turnOnDebugMode()
        } else {
          if (this.debugger) {
            this.debugger.cleanup()
            this.debugger = null
          }
        }
      }
    }

    // Now, check if ANY of the settings actually changed.
    const settingsActuallyChanged =
      positionHistoryChanged ||
      trajectoryTimeChanged ||
      tabOffsetChanged ||
      throttleDelayChanged ||
      mousePredictionChanged ||
      tabPredictionChanged ||
      debuggerSettingsChanged ||
      hitSlopChanged ||
      debugModeChanged

    if (settingsActuallyChanged) {
      this.updateDebuggerWithNewSettings()
    }
  }

  private updateDebuggerWithNewSettings(): void {
    if (!this._globalSettings.debug || !this.debugger) {
      return
    }
    this.debugger.updateControlsState(this._globalSettings)
    this.debugger.updateTrajectoryVisuals(
      this.currentPoint,
      this.predictedPoint,
      this._globalSettings.enableMousePrediction
    )
    this.elements.forEach((data, el) => {
      this.debugger!.createOrUpdateLinkOverlay(el, data)
    })
    this.debugger.refreshDisplayedElements()
  }

  private turnOnDebugMode() {
    if (!this.debugger) {
      this.debugger = ForesightDebugger.getInstance(this)
      // Then initialize it as before, passing the necessary data
      this.debugger.initialize(
        this.elements,
        this._globalSettings,
        this.currentPoint,
        this.predictedPoint
      )
    } else {
      this.updateDebuggerWithNewSettings()
    }
  }

  private updateElementBounds(
    element: ForesightElement,
    foresightElementData: ForesightElementData
  ) {
    const newOriginalRect = element.getBoundingClientRect()
    const expandedRect = getExpandedRect(
      newOriginalRect,
      foresightElementData.elementBounds.hitSlop
    )
    if (!areRectsEqual(expandedRect, foresightElementData.elementBounds.expandedRect)) {
      this.elements.set(element, {
        ...foresightElementData,
        elementBounds: {
          ...foresightElementData.elementBounds,
          originalRect: newOriginalRect,
          expandedRect,
        },
      })

      if (this.debugger) {
        const updatedData = this.elements.get(element)
        if (updatedData) this.debugger.createOrUpdateLinkOverlay(element, updatedData)
      }
    }
  }

  private forceUpdateAllElementBounds() {
    let count = 0
    this.elements.forEach((_, element) => {
      const elementData = this.elements.get(element)
      // For performance only update rects that are currently intersecting with the viewport
      if (elementData && elementData.isIntersectingWithViewport) {
        this.updateElementBounds(element, elementData)
        count++
      }
    })
    console.log(count)
  }

  private updatePointerState(e: MouseEvent): void {
    this.currentPoint = { x: e.clientX, y: e.clientY }
    this.predictedPoint = this._globalSettings.enableMousePrediction
      ? predictNextMousePosition(
          this.currentPoint,
          this.positions, // History before the currentPoint was added
          this._globalSettings.positionHistorySize,
          this._globalSettings.trajectoryPredictionTime
        )
      : { ...this.currentPoint }
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.updatePointerState(e)
    let elementsToUpdateInDebugger: ForesightElement[] | null = null
    if (this.debugger) {
      elementsToUpdateInDebugger = []
    }

    this.elements.forEach((currentData, element) => {
      if (!this.elements.has(element)) {
        return
      }

      const previousDataState = {
        isHovering: currentData.isHovering,
        trajectoryHitData: currentData.trajectoryHitData,
      }

      let callbackFiredThisCycle = false
      let finalIsHovering = currentData.isHovering
      let finalIsTrajectoryHit = currentData.trajectoryHitData.isTrajectoryHit
      let finalTrajectoryHitTime = currentData.trajectoryHitData.trajectoryHitTime

      const { expandedRect } = currentData.elementBounds

      const isCurrentlyPhysicallyHovering = isPointInRectangle(this.currentPoint, expandedRect)

      let isNewTrajectoryActivation = false
      if (
        this._globalSettings.enableMousePrediction &&
        !isCurrentlyPhysicallyHovering &&
        !currentData.trajectoryHitData.isTrajectoryHit // Only activate if not already hit
      ) {
        if (lineSegmentIntersectsRect(this.currentPoint, this.predictedPoint, expandedRect)) {
          isNewTrajectoryActivation = true
        }
      }

      if (isNewTrajectoryActivation) {
        finalIsTrajectoryHit = true
        finalTrajectoryHitTime = performance.now()
        callbackFiredThisCycle = true
        this.callCallback(currentData, element)
      }

      const isNewPhysicalHoverEvent = isCurrentlyPhysicallyHovering && !currentData.isHovering

      if (isNewPhysicalHoverEvent) {
        const hoverCanTriggerCallback =
          !currentData.trajectoryHitData.isTrajectoryHit || // If not trajectory hit, hover can trigger
          (currentData.trajectoryHitData.isTrajectoryHit &&
            !this._globalSettings.enableMousePrediction) // Or if trajectory was hit but prediction is now off

        if (!callbackFiredThisCycle && hoverCanTriggerCallback) {
          callbackFiredThisCycle = true
          this.callCallback(currentData, element)
        }
      }

      finalIsHovering = isCurrentlyPhysicallyHovering

      // If physically hovering, it overrides any "trajectory hit" state for expiration purposes
      // but the visual/logical state of isTrajectoryHit might persist if it happened first.
      // The main change is how the expiration timeout is handled.

      const coreStateActuallyChanged =
        finalIsHovering !== previousDataState.isHovering ||
        finalIsTrajectoryHit !== previousDataState.trajectoryHitData.isTrajectoryHit ||
        (finalIsTrajectoryHit &&
          finalTrajectoryHitTime !== previousDataState.trajectoryHitData.trajectoryHitTime)

      if (coreStateActuallyChanged && this.elements.has(element)) {
        let newElementData: ForesightElementData = {
          ...currentData,
          isHovering: finalIsHovering,
          trajectoryHitData: {
            isTrajectoryHit: finalIsTrajectoryHit,
            trajectoryHitTime: finalTrajectoryHitTime,
            trajectoryHitExpirationTimeoutId:
              previousDataState.trajectoryHitData.trajectoryHitExpirationTimeoutId, // Preserve existing initially
          },
        }

        // Manage trajectory hit expiration timeout
        if (
          newElementData.trajectoryHitData.isTrajectoryHit &&
          !previousDataState.trajectoryHitData.isTrajectoryHit
        ) {
          // Just became a trajectory hit (or re-hit after expiration)
          if (newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
            clearTimeout(newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
          }
          newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId = setTimeout(() => {
            const currentElementData = this.elements.get(element)
            if (
              currentElementData &&
              currentElementData.trajectoryHitData.isTrajectoryHit &&
              currentElementData.trajectoryHitData.trajectoryHitTime ===
                newElementData.trajectoryHitData.trajectoryHitTime // Ensure it's the same hit instance
            ) {
              const expiredData: ForesightElementData = {
                ...currentElementData,
                trajectoryHitData: {
                  isTrajectoryHit: false,
                  trajectoryHitExpirationTimeoutId: undefined,
                  trajectoryHitTime: currentElementData.trajectoryHitData.trajectoryHitTime,
                },
              }
              this.elements.set(element, expiredData)
              if (this.debugger) {
                this.debugger.createOrUpdateLinkOverlay(element, expiredData)
              }
            }
          }, 200)
        } else if (
          !newElementData.trajectoryHitData.isTrajectoryHit &&
          previousDataState.trajectoryHitData.isTrajectoryHit
        ) {
          // No longer a trajectory hit (e.g. mouse moved away, physical hover, or prediction disabled)
          if (newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
            clearTimeout(newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
            newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId = undefined
          }
        }
        // If it was already a trajectory hit and remains one (e.g. mouse still on trajectory path
        // without physical hover, and timeout hasn't fired), the existing timeout continues.

        this.elements.set(element, newElementData)

        if (elementsToUpdateInDebugger) {
          elementsToUpdateInDebugger.push(element)
        }
      }
    })

    if (this.debugger) {
      elementsToUpdateInDebugger?.forEach((element) => {
        const data = this.elements.get(element) // Get potentially updated data
        if (data) {
          this.debugger!.createOrUpdateLinkOverlay(element, data)
        }
      })
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this._globalSettings.enableMousePrediction
      )
    }
  }

  private handleResizeOrScroll = (): void => {
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
    }

    const now = performance.now()
    const timeSinceLastCall = now - this.lastResizeScrollCallTimestamp
    const currentDelay = this._globalSettings.resizeScrollThrottleDelay

    if (timeSinceLastCall >= currentDelay) {
      this.forceUpdateAllElementBounds()
      this.lastResizeScrollCallTimestamp = now
      this.resizeScrollThrottleTimeoutId = null
    } else {
      this.resizeScrollThrottleTimeoutId = setTimeout(() => {
        this.forceUpdateAllElementBounds()
        this.lastResizeScrollCallTimestamp = performance.now()
        this.resizeScrollThrottleTimeoutId = null
      }, currentDelay - timeSinceLastCall)
    }
  }

  private handleElementResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const element = entry.target as ForesightElement
      const foresightElementData = this.elements.get(element)
      if (foresightElementData) {
        this.updateElementBounds(element, foresightElementData)
      }
    }
  }

  /**
   * Detects when registered elements are removed from the DOM and automatically unregisters them to prevent stale references.
   *
   * @param mutationsList - Array of MutationRecord objects describing the DOM changes
   *
   */
  private handleDomMutations = (mutationsList: MutationRecord[]) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        const currentElements = Array.from(this.elements.keys())
        for (const element of currentElements) {
          if (!element.isConnected) {
            if (this.elements.has(element)) {
              this.unregister(element) // unregister will clear its own timeout
            }
          }
        }
      }
    }
  }

  // We store the last key for the FocusIn event, meaning we know if the user is tabbing around the page.
  // We dont use handleKeyDown for the full event because of 2 main reasons:
  // 1: handleKeyDown e.target returns the target on which the keydown is pressed (meaning we dont know which target got the focus)
  // 2: handleKeyUp does return the correct e.target however when holding tab the event doesnt repeat (handleKeyDown does)
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      this.lastKeyDown = e
    } else {
      this.lastKeyDown = null
    }
  }

  private handleFocusIn = (e: FocusEvent) => {
    if (!this.lastKeyDown || !this._globalSettings.enableTabPrediction) {
      return
    }
    const targetElement = e.target
    if (!(targetElement instanceof HTMLElement)) {
      return
    }

    const tabbableElements = tabbable(document.documentElement)
    const currentIndex = tabbableElements.findIndex((element) => element === targetElement)

    // Determine the range of elements to check based on the tab direction and offset
    const tabOffset = this.lastKeyDown.shiftKey
      ? -this._globalSettings.tabOffset
      : this._globalSettings.tabOffset

    // Clear the lastKeyDown as we've processed this focus event
    this.lastKeyDown = null
    const elementsToPredict: ForesightElement[] = []

    // Iterate through the tabbable elements to find those within the prediction range
    for (let i = 0; i < tabbableElements.length; i++) {
      const element = tabbableElements[i]

      // Check if the current element is within the range defined by the current focus and the tabOffset
      // The range includes the element that just received focus (at currentIndex)
      let isInRange =
        tabOffset > 0
          ? i >= currentIndex && i <= currentIndex + tabOffset
          : i <= currentIndex && i >= currentIndex + tabOffset

      if (isInRange && this.elements.has(element as ForesightElement)) {
        elementsToPredict.push(element as ForesightElement)
      }
    }

    elementsToPredict.forEach((element) => {
      this.callCallback(this.elements.get(element), element)
    })
  }

  private callCallback(elementData: ForesightElementData | undefined, element: ForesightElement) {
    if (elementData) {
      elementData.callback()
      if (this.debugger) {
        this.debugger.showCallbackPopup(elementData.elementBounds.expandedRect)
      }
      // Do everything and then unregister. Always keep this at the end of the function
      if (elementData.unregisterOnCallback) {
        this.unregister(element)
      }
    }
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const element = this.elements.get(entry.target)
      if (!element) {
        return
      }
      element.isIntersectingWithViewport = entry.isIntersecting
      if (entry.isIntersecting) {
        element.elementBounds.originalRect = entry.boundingClientRect
        element.elementBounds.expandedRect = getExpandedRect(
          element.elementBounds.originalRect,
          element.elementBounds.hitSlop
        )
        this.elementResizeObserver?.observe(entry.target)
        entry.isIntersecting
      } else {
        this.elementResizeObserver?.unobserve(entry.target)
      }
    }
    if (this.globalSettings.debug) {
      this.debugger?.refreshDisplayedElements()
    }
  }

  private initializeGlobalListeners() {
    if (this.isSetup) {
      return
    }
    // To avoid setting up listeners while ssr
    if (typeof window === "undefined" || typeof document === "undefined") {
      return
    }
    this.globalListenersController = new AbortController()
    const { signal } = this.globalListenersController
    document.addEventListener("mousemove", this.handleMouseMove, { signal })
    window.addEventListener("resize", this.handleResizeOrScroll, { signal })
    window.addEventListener("scroll", this.handleResizeOrScroll, { signal })
    // document.addEventListener("keydown", this.handleKeyDown, { signal })
    // document.addEventListener("focusin", this.handleFocusIn, { signal })

    // this.domObserver = new MutationObserver(this.handleDomMutations)
    // this.domObserver.observe(document.documentElement, {
    //   childList: true,
    //   subtree: true,
    //   attributes: true,
    // })

    // NEW: Setup IntersectionObserver
    const observerOptions = {
      root: null, // null means the viewport
      threshold: 0.0, // Trigger as soon as a single pixel is visible
    }

    this.elementIntersectionObserver = new IntersectionObserver(
      this.handleIntersection,
      observerOptions
    )

    // this.elementResizeObserver = new ResizeObserver(this.handleElementResize)
    // this.elements.forEach((_, element) => this.elementResizeObserver!.observe(element))

    this.isSetup = true
  }

  private removeGlobalListeners() {
    this.globalListenersController?.abort() // Remove all event listeners
    this.globalListenersController = null
    this.domObserver?.disconnect()
    this.elementResizeObserver?.disconnect()

    // Even though we aborted the signals there might still be an event being throttled, clear it
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
      this.resizeScrollThrottleTimeoutId = null
    }

    if (this.domMutationRectsUpdateTimeoutId) {
      clearTimeout(this.domMutationRectsUpdateTimeoutId)
      this.domMutationRectsUpdateTimeoutId = null
    }

    this.isSetup = false
  }
}
