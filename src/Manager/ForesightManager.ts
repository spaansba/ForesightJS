import { tabbable } from "tabbable"
import { ForesightDebugger } from "../Debugger/ForesightDebugger"
import { isTouchDevice } from "../helpers/isTouchDevice"
import type {
  BooleanSettingKeys,
  CallbackHits,
  ForesightElement,
  ForesightElementData,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  NumericSettingKeys,
  TrajectoryPositions,
  UpdateForsightManagerSettings,
  hitType,
} from "../types/types"
import {
  DEFAULT_ENABLE_MOUSE_PREDICTION,
  DEFAULT_ENABLE_TAB_PREDICTION,
  DEFAULT_HITSLOP,
  DEFAULT_IS_DEBUG,
  DEFAULT_IS_DEBUGGER_MINIMIZED,
  DEFAULT_POSITION_HISTORY_SIZE,
  DEFAULT_SHOW_NAME_TAGS,
  DEFAULT_TAB_OFFSET,
  DEFAULT_TRAJECTORY_PREDICTION_TIME,
  MAX_POSITION_HISTORY_SIZE,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "./constants"
import { clampNumber } from "./helpers/clampNumber"
import { lineSegmentIntersectsRect } from "./helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "./helpers/predictNextMousePosition"
import {
  areRectsEqual,
  getExpandedRect,
  isPointInRectangle,
  normalizeHitSlop,
} from "./helpers/rectAndHitSlop"
import PositionObserver from "@thednp/position-observer"
import { shouldUpdateSetting } from "./helpers/shouldUpdateSetting"
import type { PositionObserverEntry } from "@thednp/position-observer"

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
  private _globalCallbackHits: CallbackHits = {
    mouse: 0,
    tab: 0,
  }
  private _globalSettings: ForesightManagerSettings = {
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
    resizeScrollThrottleDelay: 0,
    debuggerSettings: {
      isControlPanelDefaultMinimized: DEFAULT_IS_DEBUGGER_MINIMIZED,
      showNameTags: DEFAULT_SHOW_NAME_TAGS,
    },
    enableTabPrediction: DEFAULT_ENABLE_TAB_PREDICTION,
    tabOffset: DEFAULT_TAB_OFFSET,
    onAnyCallbackFired: (
      elementData: ForesightElementData,
      managerData: ForesightManagerData
    ) => {},
  }
  private trajectoryPositions: TrajectoryPositions = {
    positions: [],
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  private domObserver: MutationObserver | null = null
  private elementIntersectionObserver: IntersectionObserver | null = null
  private positionObserver: PositionObserver | null = null
  // Track the last keydown event to determine if focus change was due to Tab
  private lastKeyDown: KeyboardEvent | null = null

  // AbortController for managing global event listeners
  private globalListenersController: AbortController | null = null

  private constructor() {}

  public static initialize(props?: Partial<UpdateForsightManagerSettings>): ForesightManager {
    if (!this.isInitiated) {
      ForesightManager.manager = new ForesightManager()
    }
    if (props !== undefined) {
      ForesightManager.manager.alterGlobalSettings(props)
    }
    return ForesightManager.manager
  }

  public get getManagerData(): Readonly<ForesightManagerData> {
    return {
      registeredElements: this.elements,
      globalSettings: this._globalSettings,
      globalCallbackHits: this._globalCallbackHits,
      positionObserverElements: this.positionObserver?.entries,
    }
  }

  public static get isInitiated(): Readonly<boolean> {
    return !!ForesightManager.manager
  }

  public static get instance(): ForesightManager {
    return this.initialize()
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
    if (this.elements.has(element)) {
      return { isTouchDevice: false, unregister: () => this.unregister(element) }
    }

    // Setup global listeners on every first element added to the manager. It gets removed again when the map is emptied
    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    const normalizedHitSlop = hitSlop
      ? normalizeHitSlop(hitSlop, this._globalSettings.debug)
      : this._globalSettings.defaultHitSlop
    const rect = element.getBoundingClientRect()
    const elementData: ForesightElementData = {
      element: element,
      callback,
      callbackHits: {
        mouse: 0,
        tab: 0,
      },
      elementBounds: {
        originalRect: rect,
        expandedRect: getExpandedRect(rect, normalizedHitSlop),
        hitSlop: normalizedHitSlop,
      },
      isHovering: false,
      trajectoryHitData: {
        isTrajectoryHit: false,
        trajectoryHitTime: 0,
        trajectoryHitExpirationTimeoutId: undefined,
      },
      name: name ?? element.id ?? "",
      unregisterOnCallback: unregisterOnCallback ?? true,
      isIntersectingWithViewport: false,
    }

    this.elements.set(element, elementData)
    // Always connect the observer After the element is registered to avoid race conditions
    this.elementIntersectionObserver?.observe(element)
    // this.positionObserver?.observe(element)

    if (this.debugger) {
      this.debugger.createOrUpdateElementOverlay(elementData)
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

    this.elementIntersectionObserver?.unobserve(element)

    this.elements.delete(element)

    if (this.debugger) {
      this.debugger.removeElement(element)
    }

    if (this.elements.size === 0 && this.isSetup) {
      this.removeGlobalListeners()
    }
  }

  private updateNumericSettings(
    newValue: number | undefined,
    setting: NumericSettingKeys,
    min: number,
    max: number
  ) {
    if (!shouldUpdateSetting(newValue, this._globalSettings[setting])) {
      return false
    }

    this._globalSettings[setting] = clampNumber(
      newValue,
      min,
      max,
      this._globalSettings.debug,
      setting
    )

    return true
  }

  private updateBooleanSetting(
    newValue: boolean | undefined,
    setting: BooleanSettingKeys
  ): boolean {
    if (!shouldUpdateSetting(newValue, this._globalSettings[setting])) {
      return false
    }
    this._globalSettings[setting] = newValue
    return true
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerSettings>): void {
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
      if (this.trajectoryPositions.positions.length > this._globalSettings.positionHistorySize) {
        this.trajectoryPositions.positions = this.trajectoryPositions.positions.slice(
          this.trajectoryPositions.positions.length - this._globalSettings.positionHistorySize
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

    if (props?.resizeScrollThrottleDelay !== undefined) {
      console.warn(
        "resizeScrollThrottleDelay is deprecated and will be removed in V3.0.0 of ForesightJS"
      )
    }

    const mousePredictionChanged = this.updateBooleanSetting(
      props?.enableMousePrediction,
      "enableMousePrediction"
    )

    const tabPredictionChanged = this.updateBooleanSetting(
      props?.enableTabPrediction,
      "enableTabPrediction"
    )

    if (props?.onAnyCallbackFired !== undefined) {
      this._globalSettings.onAnyCallbackFired = props.onAnyCallbackFired
    }

    let debuggerSettingsChanged = false
    if (props?.debuggerSettings?.isControlPanelDefaultMinimized !== undefined) {
      this._globalSettings.debuggerSettings.isControlPanelDefaultMinimized =
        props.debuggerSettings.isControlPanelDefaultMinimized
      debuggerSettingsChanged = true
    }

    if (props?.debuggerSettings?.showNameTags !== undefined) {
      this._globalSettings.debuggerSettings.showNameTags = props.debuggerSettings.showNameTags
      debuggerSettingsChanged = true
      if (this.debugger) {
        this.debugger.toggleNameTagVisibility(this._globalSettings.debuggerSettings.showNameTags)
      }
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

    const settingsActuallyChanged =
      positionHistoryChanged ||
      trajectoryTimeChanged ||
      tabOffsetChanged ||
      mousePredictionChanged ||
      tabPredictionChanged ||
      debuggerSettingsChanged ||
      hitSlopChanged ||
      debugModeChanged

    if (settingsActuallyChanged && this.debugger) {
      this.debugger.updateControlsState(this._globalSettings)
    }
  }

  private turnOnDebugMode() {
    if (!this.debugger) {
      this.debugger = ForesightDebugger.initialize(
        ForesightManager.instance,
        this.trajectoryPositions
      )
    } else {
      this.debugger.updateControlsState(this._globalSettings)
    }
  }

  private forceUpdateAllElementBounds() {
    this.elements.forEach((_, element) => {
      const elementData = this.elements.get(element)
      // For performance only update rects that are currently intersecting with the viewport
      if (elementData && elementData.isIntersectingWithViewport) {
        this.forceUpdateElementBounds(elementData)
      }
    })
  }

  private updatePointerState(e: MouseEvent): void {
    this.trajectoryPositions.currentPoint = { x: e.clientX, y: e.clientY }
    this.trajectoryPositions.predictedPoint = this._globalSettings.enableMousePrediction
      ? predictNextMousePosition(
          this.trajectoryPositions.currentPoint,
          this.trajectoryPositions.positions, // History before the currentPoint was added
          this._globalSettings.positionHistorySize,
          this._globalSettings.trajectoryPredictionTime
        )
      : { ...this.trajectoryPositions.currentPoint }
  }

  /**
   * Processes elements that unregister after a single callback.
   *
   * This is a "fire-and-forget" handler. Its only goal is to trigger the
   * callback once. It does so if the mouse trajectory is predicted to hit the
   * element (if prediction is on) OR if the mouse physically hovers over it.
   * It does not track state, as the element is immediately unregistered.
   *
   * @param elementData - The data object for the foresight element.
   * @param element - The HTML element being interacted with.
   */
  private handleSingleCallbackInteraction(elementData: ForesightElementData) {
    const { expandedRect } = elementData.elementBounds

    // A physical hover is always a valid trigger.
    const isHovering = isPointInRectangle(this.trajectoryPositions.currentPoint, expandedRect)

    // A predicted trajectory intersection is also a valid trigger.
    const isTrajectoryHit =
      this._globalSettings.enableMousePrediction &&
      lineSegmentIntersectsRect(
        this.trajectoryPositions.currentPoint,
        this.trajectoryPositions.predictedPoint,
        expandedRect
      )

    // If either condition is met, fire the callback.
    if (isHovering || isTrajectoryHit) {
      this.callCallback(elementData, "mouse")
    }
  }

  /**
   * Processes persistent elements that can have multiple callbacks and require state tracking.
   *
   * This handler is responsible for elements where `unregisterOnCallback` is false.
   * It triggers callbacks only on the "leading edge" of an interaction—that is,
   * the first moment the mouse enters an element or the first moment a trajectory
   * is predicted to hit it. This prevents the callback from firing on every
   * mouse move. It also manages the element's state (`isHovering`, `isTrajectoryHit`)
   * for visual feedback in the {@link ForesightDebugger}.
   *
   * @param elementData - The current data object for the foresight element.
   * @param element - The HTML element being interacted with.
   */
  private handleMultiCallbackInteraction(elementData: ForesightElementData) {
    const { expandedRect } = elementData.elementBounds
    const isHovering = isPointInRectangle(this.trajectoryPositions.currentPoint, expandedRect)

    const isNewPhysicalHover = isHovering && !elementData.isHovering
    const isNewTrajectoryHit =
      this._globalSettings.enableMousePrediction &&
      !isHovering &&
      !elementData.trajectoryHitData.isTrajectoryHit &&
      lineSegmentIntersectsRect(
        this.trajectoryPositions.currentPoint,
        this.trajectoryPositions.predictedPoint,
        expandedRect
      )

    if (isNewPhysicalHover || isNewTrajectoryHit) {
      this.callCallback(elementData, "mouse")
    }

    const hasStateChanged = isHovering !== elementData.isHovering || isNewTrajectoryHit

    if (hasStateChanged) {
      const newElementData: ForesightElementData = {
        ...elementData,
        isHovering: isHovering,
        trajectoryHitData: {
          ...elementData.trajectoryHitData,
          isTrajectoryHit: isNewTrajectoryHit,
          trajectoryHitTime: isNewTrajectoryHit
            ? performance.now()
            : elementData.trajectoryHitData.trajectoryHitTime,
        },
      }
      if (isNewTrajectoryHit) {
        if (newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
          clearTimeout(newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
        }
        newElementData.trajectoryHitData.trajectoryHitExpirationTimeoutId = setTimeout(() => {
          const currentData = this.elements.get(elementData.element)
          if (
            currentData &&
            currentData.trajectoryHitData.trajectoryHitTime ===
              newElementData.trajectoryHitData.trajectoryHitTime
          ) {
            currentData.trajectoryHitData.isTrajectoryHit = false
            this.debugger?.createOrUpdateElementOverlay(currentData)
          }
        }, 200)
      }
      this.elements.set(elementData.element, newElementData)
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.updatePointerState(e)

    this.elements.forEach((currentData, element) => {
      // if (!currentData.isIntersectingWithViewport) {
      //   return
      // }

      if (!currentData.unregisterOnCallback) {
        this.handleMultiCallbackInteraction(currentData)
      } else {
        this.handleSingleCallbackInteraction(currentData)
      }
    })

    if (this.debugger) {
      this.debugger.updateTrajectoryVisuals(
        this.trajectoryPositions,
        this._globalSettings.enableMousePrediction
      )
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
        for (const element of Array.from(this.elements.keys())) {
          if (!element.isConnected) {
            this.unregister(element)
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
      this.callCallback(this.elements.get(element), "tab")
    })
  }

  private updateHitCounters(elementData: ForesightElementData, hitType: hitType) {
    if (hitType === "mouse") {
      elementData.callbackHits.mouse++
      this._globalCallbackHits.mouse++
    } else if (hitType === "tab") {
      elementData.callbackHits.tab++
      this._globalCallbackHits.tab++
    }
  }

  private callCallback(elementData: ForesightElementData | undefined, hitType: hitType) {
    if (elementData) {
      this.updateHitCounters(elementData, hitType)
      elementData.callback()
      this._globalSettings.onAnyCallbackFired(elementData, this.getManagerData)
      if (this.debugger) {
        this.debugger.showCallbackAnimation(elementData)
        this.debugger.refreshDebuggerElementList() // Update the registered element count in the Registered Elements tab
      }
      // Do everything and then unregister. Always keep this at the end of the function
      if (elementData.unregisterOnCallback) {
        this.unregister(elementData.element)
      }
    }
  }

  private handleIntersection = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const elementData = this.elements.get(entry.target)
      if (!elementData) {
        return
      }
      elementData.isIntersectingWithViewport = entry.isIntersecting
      if (entry.isIntersecting) {
        elementData.elementBounds.originalRect = entry.boundingClientRect
        elementData.elementBounds.expandedRect = getExpandedRect(
          elementData.elementBounds.originalRect,
          elementData.elementBounds.hitSlop
        )
        if (this.positionObserver) {
          this.positionObserver?.observe(entry.target)
        } else {
          console.warn(
            "ForesightJS: PositionObserver is not initialized. This might lead to incorrect behavior when observing elements."
          )
        }
        if (this._globalSettings.debug) {
          this.debugger?.createOrUpdateElementOverlay(elementData)
        }
      } else {
        this.positionObserver?.unobserve(entry.target)
        if (this._globalSettings.debug) {
          this.debugger?.removeElement(entry.target)
        }
      }
    }
  }

  /**
   * ONLY use this function when you want to change the rect bounds via code, if the rects are changing because of updates in the DOM do not use this function.
   * We need an observer for that
   */
  private forceUpdateElementBounds(elementData: ForesightElementData) {
    const newOriginalRect = elementData.element.getBoundingClientRect()
    const expandedRect = getExpandedRect(newOriginalRect, elementData.elementBounds.hitSlop)

    // Since its a force update, rects can be equal.
    if (!areRectsEqual(expandedRect, elementData.elementBounds.expandedRect)) {
      this.elements.set(elementData.element, {
        ...elementData,
        elementBounds: {
          ...elementData.elementBounds,
          originalRect: newOriginalRect,
          expandedRect,
        },
      })

      if (this.debugger) {
        const updatedData = this.elements.get(elementData.element)
        if (updatedData) this.debugger.createOrUpdateElementOverlay(updatedData)
      }
    }
  }

  private updateElementBounds(newRect: DOMRect, elementData: ForesightElementData) {
    const expandedRect = getExpandedRect(newRect, elementData.elementBounds.hitSlop)
    // We dont check if rects are equal like we do in forceUpdateElementBounds, since rects can never be equal here

    this.elements.set(elementData.element, {
      ...elementData,
      elementBounds: {
        ...elementData.elementBounds,
        originalRect: newRect,
        expandedRect,
      },
    })
    if (this.debugger) {
      const updatedData = this.elements.get(elementData.element)
      if (updatedData) this.debugger.createOrUpdateElementOverlay(updatedData)
    }
  }

  private handlePositionChange = (entries: PositionObserverEntry[], _: PositionObserver) => {
    entries.forEach((entry) => {
      const elementData = this.elements.get(entry.target)
      if (elementData) {
        this.updateElementBounds(entry.boundingClientRect, elementData)
      }
    })
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
    document.addEventListener("keydown", this.handleKeyDown, { signal })
    document.addEventListener("focusin", this.handleFocusIn, { signal })

    // Mutation observer is to automatically unregister elements when they leave the DOM. Its a fail-safe for if the user forgets to do it.
    this.domObserver = new MutationObserver(this.handleDomMutations)
    this.domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
    })

    // Handles all position based changes and update the rects of the elements. completely async to avoid dirtying the main thread.
    // Handles resize of elements
    // Handles resize of viewport
    // Handles scrolling
    this.positionObserver = new PositionObserver(this.handlePositionChange)

    // Avoid doing calculations on elements that arent in the viewport.
    // Mostly used to observe/unobserve the positionObserver for elements not visible
    this.elementIntersectionObserver = new IntersectionObserver(this.handleIntersection, {
      root: null,
      threshold: 0.0,
      rootMargin: "50px",
    })

    this.isSetup = true
  }

  private removeGlobalListeners() {
    this.isSetup = false
    if (!this.debugger) {
      this.globalListenersController?.abort() // Remove all event listeners only in non debug mode
      this.globalListenersController = null
    } else {
      console.log(
        "%cForesightJS: All elements have successfully been unregistered. ForesightJS would typically perform cleanup events now, but these are currently skipped while in debug mode. Observers are cleared up.",
        "color: #28a745; font-weight: bold;"
      )
    }
    this.domObserver?.disconnect()
    this.domObserver = null
    this.elementIntersectionObserver?.disconnect()
    this.elementIntersectionObserver = null
    this.positionObserver?.disconnect()
    this.positionObserver = null
  }
}
