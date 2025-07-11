import { tabbable, type FocusableElement } from "tabbable"
import { evaluateRegistrationConditions } from "../helpers/shouldRegister"
import type {
  CallbackHits,
  ElementUnregisteredReason,
  ForesightElement,
  ForesightElementData,
  ForesightEventMap,
  ForesightEvent,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  CallbackHitType,
  ManagerBooleanSettingKeys,
  NumericSettingKeys,
  Point,
  ScrollDirection,
  TrajectoryPositions,
  UpdateForsightManagerSettings,
  ForesightEventListener,
  UpdatedDataPropertyNames,
  UpdatedManagerSetting,
  NumericSettingConfig,
} from "../types/types"
import {
  DEFAULT_ENABLE_MOUSE_PREDICTION,
  DEFAULT_ENABLE_SCROLL_PREDICTION,
  DEFAULT_ENABLE_TAB_PREDICTION,
  DEFAULT_HITSLOP,
  DEFAULT_POSITION_HISTORY_SIZE,
  DEFAULT_SCROLL_MARGIN,
  DEFAULT_TAB_OFFSET,
  DEFAULT_TRAJECTORY_PREDICTION_TIME,
  MAX_POSITION_HISTORY_SIZE,
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
} from "../constants"
import { clampNumber } from "../helpers/clampNumber"
import { lineSegmentIntersectsRect } from "../helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "../helpers/predictNextMousePosition"
import {
  areRectsEqual,
  getExpandedRect,
  isPointInRectangle,
  normalizeHitSlop,
} from "../helpers/rectAndHitSlop"
import { shouldUpdateSetting } from "../helpers/shouldUpdateSetting"
import { getFocusedElementIndex } from "../helpers/getFocusedElementIndex"
import { getScrollDirection } from "../helpers/getScrollDirection"
import { predictNextScrollPosition } from "../helpers/predictNextScrollPosition"
import { PositionObserver, PositionObserverEntry } from "position-observer"
import { initialViewportState } from "../helpers/initialViewportState"

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
  private _globalCallbackHits: CallbackHits = {
    mouse: {
      hover: 0,
      trajectory: 0,
    },
    tab: {
      forwards: 0,
      reverse: 0,
    },
    scroll: {
      down: 0,
      left: 0,
      right: 0,
      up: 0,
    },
    total: 0,
  }
  private _globalSettings: ForesightManagerSettings = {
    debug: false,
    enableMousePrediction: DEFAULT_ENABLE_MOUSE_PREDICTION,
    enableScrollPrediction: DEFAULT_ENABLE_SCROLL_PREDICTION,
    positionHistorySize: DEFAULT_POSITION_HISTORY_SIZE,
    trajectoryPredictionTime: DEFAULT_TRAJECTORY_PREDICTION_TIME,
    scrollMargin: DEFAULT_SCROLL_MARGIN,
    defaultHitSlop: {
      top: DEFAULT_HITSLOP,
      left: DEFAULT_HITSLOP,
      right: DEFAULT_HITSLOP,
      bottom: DEFAULT_HITSLOP,
    },
    enableTabPrediction: DEFAULT_ENABLE_TAB_PREDICTION,
    tabOffset: DEFAULT_TAB_OFFSET,
  }
  private trajectoryPositions: TrajectoryPositions = {
    positions: [],
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  private tabbableElementsCache: FocusableElement[] = []
  private lastFocusedIndex: number | null = null

  private predictedScrollPoint: Point | null = null
  private scrollDirection: ScrollDirection | null = null
  private domObserver: MutationObserver | null = null
  private positionObserver: PositionObserver | null = null
  // Track the last keydown event to determine if focus change was due to Tab
  private lastKeyDown: KeyboardEvent | null = null

  // AbortController for managing global event listeners
  private globalListenersController: AbortController = new AbortController()

  // RequestAnimationFrame throttling for mouse events
  private rafId: number | null = null
  private pendingMouseEvent: MouseEvent | null = null

  private eventListeners: Map<ForesightEvent, ForesightEventListener[]> = new Map()

  // Never put something in the constructor, use initialize instead
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

  public addEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>,
    options?: { signal?: AbortSignal }
  ) {
    if (options?.signal?.aborted) {
      return () => {}
    }
    const listeners = this.eventListeners.get(eventType) ?? []
    listeners.push(listener as ForesightEventListener)
    this.eventListeners.set(eventType, listeners)
    options?.signal?.addEventListener("abort", () => this.removeEventListener(eventType, listener))
  }

  public removeEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>
  ): void {
    const listeners = this.eventListeners.get(eventType)
    if (!listeners) {
      return
    }
    const index = listeners.indexOf(listener as ForesightEventListener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  private emit<K extends ForesightEvent>(event: ForesightEventMap[K]): void {
    const listeners = this.eventListeners.get(event.type)
    if (!listeners) {
      return
    }
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error(`Error in ForesightManager event listener for ${event.type}:`, error)
      }
    })
  }

  public get getManagerData(): Readonly<ForesightManagerData> {
    return {
      registeredElements: this.elements,
      globalSettings: this._globalSettings,
      globalCallbackHits: this._globalCallbackHits,
      eventListeners: this.eventListeners,
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
    name,
  }: ForesightRegisterOptions): ForesightRegisterResult {
    const { shouldRegister, isTouchDevice, isLimitedConnection } = evaluateRegistrationConditions()
    if (!shouldRegister) {
      return {
        isLimitedConnection,
        isTouchDevice,
        isRegistered: false,
        unregister: () => {},
      }
    }

    // Setup global listeners on every first element added to the manager. It gets removed again when the map is emptied
    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    const initialRect = element.getBoundingClientRect()

    const normalizedHitSlop = hitSlop
      ? normalizeHitSlop(hitSlop)
      : this._globalSettings.defaultHitSlop

    const elementData: ForesightElementData = {
      element: element,
      callback,
      elementBounds: {
        originalRect: initialRect,
        expandedRect: getExpandedRect(initialRect, normalizedHitSlop),
        hitSlop: normalizedHitSlop,
      },
      isHovering: false,
      trajectoryHitData: {
        isTrajectoryHit: false,
        trajectoryHitTime: 0,
        trajectoryHitExpirationTimeoutId: undefined,
      },
      name: name || element.id || "unnamed",
      isIntersectingWithViewport: initialViewportState(initialRect),
      isRunningCallback: false,
      registerCount: (this.registeredElements.get(element)?.registerCount ?? 0) + 1,
    }

    this.elements.set(element, elementData)

    this.positionObserver?.observe(element)

    this.emit({
      type: "elementRegistered",
      timestamp: Date.now(),
      elementData,
    })

    return {
      isTouchDevice,
      isLimitedConnection,
      isRegistered: true,
      unregister: () => this.unregister(element, "apiCall"),
    }
  }

  private unregister(element: ForesightElement, unregisterReason: ElementUnregisteredReason) {
    if (!this.elements.has(element)) {
      return
    }

    const elementData = this.elements.get(element)

    // Clear any pending trajectory expiration timeout
    if (elementData?.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
      clearTimeout(elementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
    }

    this.positionObserver?.unobserve(element)
    this.elements.delete(element)

    if (this.elements.size === 0 && this.isSetup) {
      this.removeGlobalListeners()
    }

    if (elementData) {
      this.emit({
        type: "elementUnregistered",
        elementData: elementData,
        timestamp: Date.now(),
        unregisterReason: unregisterReason,
      })
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

    this._globalSettings[setting] = clampNumber(newValue, min, max, setting)

    return true
  }

  private updateBooleanSetting(
    newValue: boolean | undefined,
    setting: ManagerBooleanSettingKeys
  ): boolean {
    if (!shouldUpdateSetting(newValue, this._globalSettings[setting])) {
      return false
    }
    this._globalSettings[setting] = newValue
    return true
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerSettings>): void {
    const changedSettings: UpdatedManagerSetting[] = []
    const NUMERIC_SETTING_CONFIGS: readonly NumericSettingConfig[] = [
      {
        setting: "positionHistorySize",
        min: MIN_POSITION_HISTORY_SIZE,
        max: MAX_POSITION_HISTORY_SIZE,
      },
      {
        setting: "trajectoryPredictionTime",
        min: MIN_TRAJECTORY_PREDICTION_TIME,
        max: MAX_TRAJECTORY_PREDICTION_TIME,
      },
      {
        setting: "scrollMargin",
        min: MIN_SCROLL_MARGIN,
        max: MAX_SCROLL_MARGIN,
      },
      {
        setting: "tabOffset",
        min: MIN_TAB_OFFSET,
        max: MAX_TAB_OFFSET,
      },
    ]

    NUMERIC_SETTING_CONFIGS.forEach(({ setting, min, max }) => {
      const newValue = props?.[setting]
      if (newValue === undefined) return

      const oldValue = this._globalSettings[setting]
      const changed = this.updateNumericSettings(newValue, setting, min, max)

      if (changed) {
        changedSettings.push({
          setting,
          oldValue,
          newValue: this._globalSettings[setting],
        })

        if (
          setting === "positionHistorySize" &&
          this._globalSettings.positionHistorySize < oldValue
        ) {
          const newSize = this._globalSettings.positionHistorySize
          if (this.trajectoryPositions.positions.length > newSize) {
            this.trajectoryPositions.positions = this.trajectoryPositions.positions.slice(-newSize)
          }
        }
      }
    })

    const booleanSettings: ManagerBooleanSettingKeys[] = [
      "enableMousePrediction",
      "enableScrollPrediction",
      "enableTabPrediction",
    ]

    booleanSettings.forEach(setting => {
      const newValue = props?.[setting]
      if (newValue === undefined) return

      const oldValue = this._globalSettings[setting]
      const changed = this.updateBooleanSetting(newValue, setting)

      if (changed) {
        changedSettings.push({ setting, oldValue, newValue: this._globalSettings[setting] })
      }
    })

    if (props?.defaultHitSlop !== undefined) {
      const oldHitSlop = this._globalSettings.defaultHitSlop
      const normalizedNewHitSlop = normalizeHitSlop(props.defaultHitSlop)

      if (!areRectsEqual(oldHitSlop, normalizedNewHitSlop)) {
        this._globalSettings.defaultHitSlop = normalizedNewHitSlop
        changedSettings.push({
          setting: "defaultHitSlop",
          oldValue: oldHitSlop,
          newValue: normalizedNewHitSlop,
        })
        this.forceUpdateAllElementBounds()
      }
    }

    if (changedSettings.length > 0) {
      this.emit({
        type: "managerSettingsChanged",
        timestamp: Date.now(),
        managerData: this.getManagerData,
        updatedSettings: changedSettings,
      })
    }
  }

  private forceUpdateAllElementBounds() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_, elementData] of this.elements) {
      if (elementData.isIntersectingWithViewport) {
        this.forceUpdateElementBounds(elementData)
      }
    }
  }

  private updatePointerState(e: MouseEvent): void {
    const currentPoint = { x: e.clientX, y: e.clientY }
    this.trajectoryPositions.currentPoint = currentPoint

    if (this._globalSettings.enableMousePrediction) {
      this.trajectoryPositions.predictedPoint = predictNextMousePosition(
        currentPoint,
        this.trajectoryPositions.positions,
        this._globalSettings.positionHistorySize,
        this._globalSettings.trajectoryPredictionTime
      )
    } else {
      this.trajectoryPositions.predictedPoint = currentPoint
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.pendingMouseEvent = e
    // Throttle processing to animation frames for better performance
    if (this.rafId) return

    this.rafId = requestAnimationFrame(() => {
      if (this.pendingMouseEvent) {
        this.processMouseMovement(this.pendingMouseEvent)
        this.pendingMouseEvent = null
      }
      this.rafId = null
    })
  }

  private processMouseMovement(e: MouseEvent) {
    this.updatePointerState(e)

    // Use for...of instead of forEach for better performance in hot code path
    // Avoids function call overhead and iterator creation on every mouse move
    for (const currentData of this.elements.values()) {
      if (!currentData.isIntersectingWithViewport) {
        continue
      }
      const expandedRect = currentData.elementBounds.expandedRect

      if (!this._globalSettings.enableMousePrediction) {
        if (isPointInRectangle(this.trajectoryPositions.currentPoint, expandedRect)) {
          this.callCallback(currentData, { kind: "mouse", subType: "hover" })
          return
        }
        // when enable mouse prediction is off, we only check if the mouse is physically hovering over the element
      } else if (
        lineSegmentIntersectsRect(
          this.trajectoryPositions.currentPoint,
          this.trajectoryPositions.predictedPoint,
          expandedRect
        )
      ) {
        this.callCallback(currentData, { kind: "mouse", subType: "trajectory" })
      }
    }

    this.emit({
      type: "mouseTrajectoryUpdate",
      predictionEnabled: this._globalSettings.enableMousePrediction,
      trajectoryPositions: this.trajectoryPositions,
    })
  }

  /**
   * Detects when registered elements are removed from the DOM and automatically unregisters them to prevent stale references.
   *
   * @param mutationsList - Array of MutationRecord objects describing the DOM changes
   *
   */
  private handleDomMutations = (mutationsList: MutationRecord[]) => {
    // Invalidate tabbale elements cache
    if (mutationsList.length) {
      this.tabbableElementsCache = []
      this.lastFocusedIndex = null
    }
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        for (const element of this.elements.keys()) {
          if (!element.isConnected) {
            this.unregister(element, "disconnected")
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
    for (let i = 0; i <= this._globalSettings.tabOffset; i++) {
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
      const foresightElement = this.elements.get(element)
      if (foresightElement) {
        this.callCallback(foresightElement, {
          kind: "tab",
          subType: isReversed ? "reverse" : "forwards",
        })
      }
    })
  }

  private updateHitCounters(callbackHitType: CallbackHitType) {
    switch (callbackHitType.kind) {
      case "mouse":
        this._globalCallbackHits.mouse[callbackHitType.subType]++
        break
      case "tab":
        this._globalCallbackHits.tab[callbackHitType.subType]++
        break
      case "scroll":
        this._globalCallbackHits.scroll[callbackHitType.subType]++
        break
      default:
        callbackHitType satisfies never
    }
    this._globalCallbackHits.total++
  }

  private callCallback(elementData: ForesightElementData, callbackHitType: CallbackHitType) {
    if (elementData.isRunningCallback) {
      return
    }
    // We have this async wrapper so we can time exactly how long the callback takes
    elementData.isRunningCallback = true
    const asyncCallbackWrapper = async () => {
      this.updateHitCounters(callbackHitType)
      this.emit({
        type: "callbackInvoked",
        timestamp: Date.now(),
        elementData,
        hitType: callbackHitType,
      })
      const start = performance.now()
      try {
        await elementData.callback()
        this.emit({
          type: "callbackCompleted",
          timestamp: Date.now(),
          elementData,
          hitType: callbackHitType,
          elapsed: performance.now() - start,
          status: "success",
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(
          `Error in callback for element ${elementData.name} (${elementData.element.tagName}):`,
          error
        )
        this.emit({
          type: "callbackCompleted",
          timestamp: Date.now(),
          elementData,
          hitType: callbackHitType,
          elapsed: performance.now() - start,
          status: "error",
          errorMessage,
        })
      }
      this.unregister(elementData.element, "callbackHit")
    }
    asyncCallbackWrapper()
  }

  /**
   * ONLY use this function when you want to change the rect bounds via code, if the rects are changing because of updates in the DOM do not use this function.
   * We need an observer for that
   */
  private forceUpdateElementBounds(elementData: ForesightElementData) {
    const newOriginalRect = elementData.element.getBoundingClientRect()
    const expandedRect = getExpandedRect(newOriginalRect, elementData.elementBounds.hitSlop)

    if (!areRectsEqual(expandedRect, elementData.elementBounds.expandedRect)) {
      const updatedElementData = {
        ...elementData,
        elementBounds: {
          ...elementData.elementBounds,
          originalRect: newOriginalRect,
          expandedRect,
        },
      }
      this.elements.set(elementData.element, updatedElementData)

      this.emit({
        type: "elementDataUpdated",
        elementData: updatedElementData,
        updatedProps: ["bounds"],
      })
    }
  }

  private handlePositionChange = (entries: PositionObserverEntry[]) => {
    for (const entry of entries) {
      const elementData = this.elements.get(entry.target)
      if (!elementData) {
        continue
      }

      // Always call handlePositionChangeDataUpdates before handleScrollPrefetch
      this.handlePositionChangeDataUpdates(elementData, entry)
      this.handleScrollPrefetch(elementData, entry.boundingClientRect)
    }
    // Reset scroll prefetch
    this.scrollDirection = null
    this.predictedScrollPoint = null
  }

  private handlePositionChangeDataUpdates = (
    elementData: ForesightElementData,
    entry: PositionObserverEntry
  ) => {
    const updatedProps: UpdatedDataPropertyNames[] = []
    const isNowIntersecting = entry.isIntersecting

    // Create updated element data with new intersection state
    let updatedElementData = {
      ...elementData,
      isIntersectingWithViewport: isNowIntersecting,
    }

    // Track visibility changes
    if (elementData.isIntersectingWithViewport !== isNowIntersecting) {
      updatedProps.push("visibility")
    }

    // Handle bounds updates for intersecting elements
    if (isNowIntersecting) {
      updatedProps.push("bounds")
      this.handleScrollPrefetch(updatedElementData, entry.boundingClientRect)
      updatedElementData = {
        ...updatedElementData,
        elementBounds: {
          hitSlop: elementData.elementBounds.hitSlop,
          originalRect: entry.boundingClientRect,
          expandedRect: getExpandedRect(
            entry.boundingClientRect,
            elementData.elementBounds.hitSlop
          ),
        },
      }
    }

    // Update state and emit once
    this.elements.set(elementData.element, updatedElementData)
    if (updatedProps.length) {
      this.emit({
        type: "elementDataUpdated",
        elementData: updatedElementData,
        updatedProps,
      })
    }
  }

  private handleScrollPrefetch(elementData: ForesightElementData, newRect: DOMRect) {
    if (!elementData.isIntersectingWithViewport) {
      return
    }
    if (!this._globalSettings.enableScrollPrediction) {
      // If we dont check for scroll prediction, check if the user is hovering over the element during a scroll instead
      if (
        isPointInRectangle(
          this.trajectoryPositions.currentPoint,
          elementData.elementBounds.expandedRect
        )
      ) {
        this.callCallback(elementData, {
          kind: "mouse",
          subType: "hover",
        })
      }
    } else {
      // ONCE per handlePositionChange batch we decide what the scroll direction is
      this.scrollDirection =
        this.scrollDirection ?? getScrollDirection(elementData.elementBounds.originalRect, newRect)
      if (this.scrollDirection === "none") {
        return
      }
      // ONCE per handlePositionChange batch we decide the predicted scroll point
      this.predictedScrollPoint =
        this.predictedScrollPoint ??
        predictNextScrollPosition(
          this.trajectoryPositions.currentPoint,
          this.scrollDirection,
          this._globalSettings.scrollMargin
        )

      // Check if the scroll is going to intersect with an registered element
      if (
        lineSegmentIntersectsRect(
          this.trajectoryPositions.currentPoint,
          this.predictedScrollPoint,
          elementData.elementBounds.expandedRect
        )
      ) {
        this.callCallback(elementData, {
          kind: "scroll",
          subType: this.scrollDirection,
        })
      }
      this.emit({
        type: "scrollTrajectoryUpdate",
        currentPoint: this.trajectoryPositions.currentPoint,
        predictedPoint: this.predictedScrollPoint,
        scrollDirection: this.scrollDirection,
      })
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

    const { signal } = this.globalListenersController
    //TODO only add event listeners when the events are enabled (mouse/tab)
    document.addEventListener("mousemove", this.handleMouseMove) // Dont add signal we still need to emit events even without elements
    document.addEventListener("keydown", this.handleKeyDown, { signal })
    document.addEventListener("focusin", this.handleFocusIn, { signal })

    //Mutation observer is to automatically unregister elements when they leave the DOM. Its a fail-safe for if the user forgets to do it.
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

    this.isSetup = true
  }

  private removeGlobalListeners() {
    this.isSetup = false

    this.globalListenersController?.abort() // Remove all event listeners only in non debug mode
    this.tabbableElementsCache = []
    this.lastFocusedIndex = null
    this.domObserver?.disconnect()
    this.domObserver = null
    this.positionObserver?.disconnect()
    this.positionObserver = null

    // Cancel any pending RAF and clean up mouse event throttling
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.pendingMouseEvent = null
  }
}
