import { PositionObserver, PositionObserverEntry } from "position-observer"
import {
  DEFAULT_ENABLE_MOUSE_PREDICTION,
  DEFAULT_ENABLE_SCROLL_PREDICTION,
  DEFAULT_ENABLE_TAB_PREDICTION,
  DEFAULT_HITSLOP,
  DEFAULT_POSITION_HISTORY_SIZE,
  DEFAULT_SCROLL_MARGIN,
  DEFAULT_STALE_TIME,
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
import { CircularBuffer } from "../helpers/CircularBuffer"
import { clampNumber } from "../helpers/clampNumber"
import { initialViewportState } from "../helpers/initialViewportState"
import {
  areRectsEqual,
  getExpandedRect,
  isPointInRectangle,
  normalizeHitSlop,
} from "../helpers/rectAndHitSlop"
import { evaluateRegistrationConditions } from "../helpers/shouldRegister"
import { shouldUpdateSetting } from "../helpers/shouldUpdateSetting"
import type {
  CallbackHits,
  CallbackHitType,
  callbackStatus,
  ElementUnregisteredReason,
  ForesightElement,
  ForesightElementData,
  ForesightEvent,
  ForesightEventListener,
  ForesightEventMap,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  ManagerBooleanSettingKeys,
  NumericSettingKeys,
  TrajectoryPositions,
  UpdatedDataPropertyNames,
  UpdatedManagerSetting,
  UpdateForsightManagerSettings,
} from "../types/types"
import type { PredictorDependencies } from "./BasePredictor"
import { MousePredictor } from "./MousePredictor"
import { ScrollPredictor } from "./ScrollPredictor"
import { TabPredictor } from "./TabPredictor"

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
  private trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer(DEFAULT_POSITION_HISTORY_SIZE),
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }
  private isSetup: boolean = false
  private idCounter: number = 0
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

  private domObserver: MutationObserver | null = null
  private positionObserver: PositionObserver | null = null
  private eventListeners: Map<ForesightEvent, ForesightEventListener[]> = new Map()
  private hasElementRegisteredListeners = false
  private hasElementReactivatedListeners = false
  private hasElementUnregisteredListeners = false
  private hasElementDataUpdatedListeners = false
  private hasCallbackInvokedListeners = false
  private hasCallbackCompletedListeners = false
  private hasMouseTrajectoryUpdateListeners = false
  private hasScrollTrajectoryUpdateListeners = false
  private hasManagerSettingsChangedListeners = false
  private mousePredictor: MousePredictor | null = null
  private tabPredictor: TabPredictor | null = null
  private scrollPredictor: ScrollPredictor | null = null
  private constructor() {}

  private generateId(): string {
    return `foresight-${++this.idCounter}`
  }

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

    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i](event)
      } catch (error) {
        console.error(`Error in ForesightManager event listener ${i} for ${event.type}:`, error)
      }
    }
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
    meta,
    reactivateAfter,
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
    const previousElementData = this.elements.get(element)
    if (previousElementData) {
      previousElementData.registerCount++
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
      id: this.generateId(),
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

      registerCount: 1,
      meta: meta ?? {},
      callbackInfo: {
        callbackFiredCount: 0,
        lastCallbackInvokedAt: undefined,
        lastCallbackCompletedAt: undefined,
        lastCallbackRuntime: undefined,
        lastCallbackStatus: undefined,
        lastCallbackErrorMessage: undefined,
        reactivateAfter: reactivateAfter ?? DEFAULT_STALE_TIME,
        isCallbackActive: true,
        isRunningCallback: false,
        reactivateTimeoutId: undefined,
      },
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
      unregister: () => {},
    }
  }

  public unregister(element: ForesightElement, unregisterReason?: ElementUnregisteredReason) {
    const elementData = this.elements.get(element)
    if (!elementData) {
      return
    }

    if (elementData?.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
      clearTimeout(elementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
    }

    // Clear reactivation timeout if exists
    if (elementData?.callbackInfo.reactivateTimeoutId) {
      clearTimeout(elementData.callbackInfo.reactivateTimeoutId)
    }

    this.positionObserver?.unobserve(element)
    this.elements.delete(element)

    const wasLastElement = this.elements.size === 0 && this.isSetup

    if (wasLastElement) {
      this.removeGlobalListeners()
    }

    if (elementData) {
      this.emit({
        type: "elementUnregistered",
        elementData: elementData,
        timestamp: Date.now(),
        unregisterReason: unregisterReason ?? "by user",
        wasLastElement: wasLastElement,
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

    const oldTrajectoryPredictionTime = this._globalSettings.trajectoryPredictionTime
    const trajectoryPredictionTimeChanged = this.updateNumericSettings(
      props?.trajectoryPredictionTime,
      "trajectoryPredictionTime",
      MIN_TRAJECTORY_PREDICTION_TIME,
      MAX_TRAJECTORY_PREDICTION_TIME
    )
    if (trajectoryPredictionTimeChanged) {
      changedSettings.push({
        setting: "trajectoryPredictionTime",
        oldValue: oldTrajectoryPredictionTime,
        newValue: this._globalSettings.trajectoryPredictionTime,
      })
    }

    const oldPositionHistorySize = this._globalSettings.positionHistorySize
    const positionHistorySizeChanged = this.updateNumericSettings(
      props?.positionHistorySize,
      "positionHistorySize",
      MIN_POSITION_HISTORY_SIZE,
      MAX_POSITION_HISTORY_SIZE
    )
    if (positionHistorySizeChanged) {
      changedSettings.push({
        setting: "positionHistorySize",
        oldValue: oldPositionHistorySize,
        newValue: this._globalSettings.positionHistorySize,
      })
      this.trajectoryPositions.positions.resize(this._globalSettings.positionHistorySize)
    }

    const oldScrollMargin = this._globalSettings.scrollMargin
    const scrollMarginChanged = this.updateNumericSettings(
      props?.scrollMargin,
      "scrollMargin",
      MIN_SCROLL_MARGIN,
      MAX_SCROLL_MARGIN
    )
    if (scrollMarginChanged) {
      const newValue = this._globalSettings.scrollMargin
      if (this.scrollPredictor) {
        this.scrollPredictor.scrollMargin = newValue
      }
      changedSettings.push({
        setting: "scrollMargin",
        oldValue: oldScrollMargin,
        newValue: newValue,
      })
    }

    const oldTabOffset = this._globalSettings.tabOffset
    const tabOffsetChanged = this.updateNumericSettings(
      props?.tabOffset,
      "tabOffset",
      MIN_TAB_OFFSET,
      MAX_TAB_OFFSET
    )
    if (tabOffsetChanged) {
      if (this.tabPredictor) {
        this.tabPredictor.tabOffset = this._globalSettings.tabOffset
      }
      changedSettings.push({
        setting: "tabOffset",
        oldValue: oldTabOffset,
        newValue: this._globalSettings.tabOffset,
      })
    }

    const oldEnableMousePrediction = this._globalSettings.enableMousePrediction
    const enableMousePredictionChanged = this.updateBooleanSetting(
      props?.enableMousePrediction,
      "enableMousePrediction"
    )
    if (enableMousePredictionChanged) {
      changedSettings.push({
        setting: "enableMousePrediction",
        oldValue: oldEnableMousePrediction,
        newValue: this._globalSettings.enableMousePrediction,
      })
    }

    const oldEnableScrollPrediction = this._globalSettings.enableScrollPrediction
    const enableScrollPredictionChanged = this.updateBooleanSetting(
      props?.enableScrollPrediction,
      "enableScrollPrediction"
    )
    if (enableScrollPredictionChanged) {
      if (this._globalSettings.enableScrollPrediction) {
        this.scrollPredictor = new ScrollPredictor({
          dependencies: {
            callCallback: this.callCallback.bind(this),
            emit: this.emit.bind(this),
            elements: this.elements,
          },
          settings: {
            scrollMargin: this._globalSettings.scrollMargin,
          },
          trajectoryPositions: this.trajectoryPositions,
        })
      } else {
        this.scrollPredictor?.cleanup()
        this.scrollPredictor = null
      }
      changedSettings.push({
        setting: "enableScrollPrediction",
        oldValue: oldEnableScrollPrediction,
        newValue: this._globalSettings.enableScrollPrediction,
      })
    }

    const oldEnableTabPrediction = this._globalSettings.enableTabPrediction
    const enableTabPredictionChanged = this.updateBooleanSetting(
      props?.enableTabPrediction,
      "enableTabPrediction"
    )
    if (enableTabPredictionChanged) {
      changedSettings.push({
        setting: "enableTabPrediction",
        oldValue: oldEnableTabPrediction,
        newValue: this._globalSettings.enableTabPrediction,
      })
      if (this._globalSettings.enableTabPrediction) {
        this.tabPredictor = new TabPredictor({
          dependencies: {
            callCallback: this.callCallback.bind(this),
            emit: this.emit.bind(this),
            elements: this.elements,
          },
          settings: {
            tabOffset: this._globalSettings.tabOffset,
          },
        })
      } else {
        this.tabPredictor?.cleanup()
        this.tabPredictor = null
      }
    }

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

  /**
   * Detects when registered elements are removed from the DOM and automatically unregisters them to prevent stale references.
   *
   * @param mutationsList - Array of MutationRecord objects describing the DOM changes
   *
   */
  private handleDomMutations = (mutationsList: MutationRecord[]) => {
    // Invalidate tabbale elements cache
    if (mutationsList.length) {
      this.tabPredictor?.invalidateCache()
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

  public reactivate(element: ForesightElement) {
    const elementData = this.elements.get(element)
    if (!elementData) {
      return
    }

    // Clear any existing reactivation timeout
    if (elementData.callbackInfo.reactivateTimeoutId) {
      clearTimeout(elementData.callbackInfo.reactivateTimeoutId)
      elementData.callbackInfo.reactivateTimeoutId = undefined
    }

    // Only reactivate if callback is not currently running
    if (!elementData.callbackInfo.isRunningCallback) {
      elementData.callbackInfo.isCallbackActive = true
      this.positionObserver?.observe(elementData.element)
      this.emit({
        type: "elementReactivated",
        elementData: elementData,
        timestamp: Date.now(),
      })
    }
  }

  private makeElementUnactive(elementData: ForesightElementData) {
    elementData.callbackInfo.callbackFiredCount++
    elementData.callbackInfo.lastCallbackInvokedAt = Date.now()
    elementData.callbackInfo.isRunningCallback = true
    // dont set isCallbackActive to false here, only do that after the callback is finished running

    // Clear any existing reactivation timeout
    if (elementData.callbackInfo.reactivateTimeoutId) {
      clearTimeout(elementData.callbackInfo.reactivateTimeoutId)
      elementData.callbackInfo.reactivateTimeoutId = undefined
    }

    if (elementData?.trajectoryHitData.trajectoryHitExpirationTimeoutId) {
      clearTimeout(elementData.trajectoryHitData.trajectoryHitExpirationTimeoutId)
    }
    this.positionObserver?.unobserve(elementData.element)

    // TODO Was last element check
    // TODO emit element unactive
  }

  private callCallback(elementData: ForesightElementData, callbackHitType: CallbackHitType) {
    if (elementData.callbackInfo.isRunningCallback || !elementData.callbackInfo.isCallbackActive) {
      return
    }

    this.makeElementUnactive(elementData)
    // We have this async wrapper so we can time exactly how long the callback takes
    const asyncCallbackWrapper = async () => {
      this.updateHitCounters(callbackHitType)
      this.emit({
        type: "callbackInvoked",
        timestamp: Date.now(),
        elementData,
        hitType: callbackHitType,
      })

      const start = performance.now()
      let status: callbackStatus = undefined
      let errorMessage = null
      try {
        await elementData.callback()
        status = "success"
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : String(error)
        status = "error"
        console.error(
          `Error in callback for element ${elementData.name} (${elementData.element.tagName}):`,
          error
        )
      }

      elementData.callbackInfo.lastCallbackCompletedAt = Date.now()
      this.emit({
        type: "callbackCompleted",
        timestamp: Date.now(),
        elementData,
        hitType: callbackHitType,
        elapsed: (elementData.callbackInfo.lastCallbackRuntime = performance.now() - start),
        status: (elementData.callbackInfo.lastCallbackStatus = status),
        errorMessage: (elementData.callbackInfo.lastCallbackErrorMessage = errorMessage),
      })

      // Reset running state
      elementData.callbackInfo.isRunningCallback = false

      //Only make the callback unactive AFTER the callback is finished running
      elementData.callbackInfo.isCallbackActive = false

      // Schedule element to become active again after reactivateAfter
      if (
        elementData.callbackInfo.reactivateAfter !== Infinity &&
        elementData.callbackInfo.reactivateAfter > 0
      ) {
        elementData.callbackInfo.reactivateTimeoutId = setTimeout(() => {
          this.reactivate(elementData.element)
        }, elementData.callbackInfo.reactivateAfter)
      }
    }
    asyncCallbackWrapper()
  }

  private handlePositionChange = (entries: PositionObserverEntry[]) => {
    const enableScrollPosition = this._globalSettings.enableScrollPrediction
    for (const entry of entries) {
      const elementData = this.elements.get(entry.target)
      if (!elementData) {
        continue
      }
      if (enableScrollPosition) {
        this.scrollPredictor?.handleScrollPrefetch(elementData, entry.boundingClientRect)
      } else {
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
      }
      // Always call handlePositionChangeDataUpdates AFTER handleScrollPrefetch since handlePositionChangeDataUpdates alters the elementData
      this.handlePositionChangeDataUpdates(elementData, entry)
    }

    // End batch processing for scroll prediction
    if (this._globalSettings.enableScrollPrediction) {
      this.scrollPredictor?.resetScrollProps()
    }
  }

  private handlePositionChangeDataUpdates = (
    elementData: ForesightElementData,
    entry: PositionObserverEntry
  ) => {
    const updatedProps: UpdatedDataPropertyNames[] = []
    const isNowIntersecting = entry.isIntersecting

    // Track visibility changes
    if (elementData.isIntersectingWithViewport !== isNowIntersecting) {
      updatedProps.push("visibility")
      elementData.isIntersectingWithViewport = isNowIntersecting
    }

    // Handle bounds updates for intersecting elements
    if (isNowIntersecting) {
      updatedProps.push("bounds")
      elementData.elementBounds = {
        hitSlop: elementData.elementBounds.hitSlop,
        originalRect: entry.boundingClientRect,
        expandedRect: getExpandedRect(entry.boundingClientRect, elementData.elementBounds.hitSlop),
      }
    }
    if (updatedProps.length) {
      this.emit({
        type: "elementDataUpdated",
        elementData: elementData,
        updatedProps,
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

    const settings = this._globalSettings
    const dependencies: PredictorDependencies = {
      callCallback: this.callCallback.bind(this),
      emit: this.emit.bind(this),
      elements: this.elements,
    }

    if (settings.enableTabPrediction) {
      this.tabPredictor = new TabPredictor({
        dependencies,
        settings: {
          tabOffset: settings.tabOffset,
        },
      })
    }

    if (settings.enableScrollPrediction) {
      this.scrollPredictor = new ScrollPredictor({
        dependencies,
        settings: {
          scrollMargin: settings.scrollMargin,
        },
        trajectoryPositions: this.trajectoryPositions,
      })
    }

    // Always initialize mouse since if its not enabled we still check for hover and need it for scroll
    this.mousePredictor = new MousePredictor({
      dependencies,
      settings: {
        enableMousePrediction: settings.enableMousePrediction,
        trajectoryPredictionTime: settings.trajectoryPredictionTime,
        positionHistorySize: settings.positionHistorySize,
      },
      trajectoryPositions: this.trajectoryPositions,
    })

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
    this.domObserver?.disconnect()
    this.domObserver = null
    this.positionObserver?.disconnect()
    this.positionObserver = null
    this.mousePredictor?.cleanup()
    this.tabPredictor?.cleanup()
    this.scrollPredictor?.cleanup()
  }

  private forceUpdateAllElementBounds() {
    for (const [, elementData] of this.elements) {
      if (elementData.isIntersectingWithViewport) {
        this.forceUpdateElementBounds(elementData)
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
        updatedProps: ["bounds" as const],
      })
    }
  }
}
