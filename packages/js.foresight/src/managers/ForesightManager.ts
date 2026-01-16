import { areRectsEqual, getExpandedRect } from "../helpers/rectAndHitSlop"
import { evaluateRegistrationConditions, userUsesTouchDevice } from "../helpers/shouldRegister"
import {
  createDefaultSettings,
  createElementData,
  createInitialCallbackHits,
} from "../helpers/createInitialState"
import { ForesightEventEmitter } from "../core/ForesightEventEmitter"
import { applySettingsChanges, initializeSettings } from "./SettingsManager"
import type {
  CallbackHits,
  CallbackHitType,
  callbackStatus,
  CurrentDeviceStrategy,
  ElementUnregisteredReason,
  ForesightElement,
  ForesightElementData,
  ForesightEvent,
  ForesightEventListener,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  UpdateForsightManagerSettings,
} from "../types/types"
import { DesktopHandler } from "./DesktopHandler"
import { TouchDeviceHandler } from "./TouchDeviceHandler"

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
  private checkableElements: Set<ForesightElementData> = new Set()
  private idCounter: number = 0
  private activeElementCount: number = 0

  private desktopHandler: DesktopHandler
  private touchDeviceHandler: TouchDeviceHandler
  private handler: DesktopHandler | TouchDeviceHandler

  private isSetup: boolean = false
  private pendingPointerEvent: PointerEvent | null = null
  private rafId: number | null = null
  private domObserver: MutationObserver | null = null
  private currentDeviceStrategy: CurrentDeviceStrategy = userUsesTouchDevice() ? "touch" : "mouse"

  private eventEmitter = new ForesightEventEmitter()
  private _globalCallbackHits: CallbackHits = createInitialCallbackHits()
  private _globalSettings: ForesightManagerSettings = createDefaultSettings()

  private constructor(initialSettings?: Partial<UpdateForsightManagerSettings>) {
    if (initialSettings !== undefined) {
      initializeSettings(this._globalSettings, initialSettings)
    }

    const dependencies = {
      elements: this.elements,
      checkableElements: this.checkableElements,
      callCallback: this.callCallback.bind(this),
      emit: this.eventEmitter.emit.bind(this.eventEmitter),
      hasListeners: this.eventEmitter.hasListeners.bind(this.eventEmitter),
      updateCheckableStatus: this.updateCheckableStatus.bind(this),
      settings: this._globalSettings,
    }

    this.desktopHandler = new DesktopHandler(dependencies)
    this.touchDeviceHandler = new TouchDeviceHandler(dependencies)
    this.handler =
      this.currentDeviceStrategy === "mouse" ? this.desktopHandler : this.touchDeviceHandler

    this.devLog(`ForesightManager initialized with device strategy: ${this.currentDeviceStrategy}`)
    this.initializeGlobalListeners()
  }

  public static initialize(props?: Partial<UpdateForsightManagerSettings>): ForesightManager {
    if (!this.isInitiated) {
      ForesightManager.manager = new ForesightManager(props)
    }
    return ForesightManager.manager
  }

  public static get isInitiated(): Readonly<boolean> {
    return !!ForesightManager.manager
  }

  public static get instance(): ForesightManager {
    return this.initialize()
  }

  private generateId(): string {
    return `foresight-${++this.idCounter}`
  }

  public addEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>,
    options?: { signal?: AbortSignal }
  ): void {
    this.eventEmitter.addEventListener(eventType, listener, options)
  }

  public removeEventListener<K extends ForesightEvent>(
    eventType: K,
    listener: ForesightEventListener<K>
  ): void {
    this.eventEmitter.removeEventListener(eventType, listener)
  }

  public hasListeners<K extends ForesightEvent>(eventType: K): boolean {
    return this.eventEmitter.hasListeners(eventType)
  }

  public get getManagerData(): Readonly<ForesightManagerData> {
    return {
      registeredElements: this.elements,
      globalSettings: this._globalSettings,
      globalCallbackHits: this._globalCallbackHits,
      eventListeners: this.eventEmitter.getEventListeners(),
      currentDeviceStrategy: this.currentDeviceStrategy,
      activeElementCount: this.activeElementCount,
    }
  }

  public get registeredElements(): ReadonlyMap<ForesightElement, ForesightElementData> {
    return this.elements
  }

  public register(options: ForesightRegisterOptions): ForesightRegisterResult {
    const { isTouchDevice, isLimitedConnection, shouldRegister } = evaluateRegistrationConditions()

    if (!shouldRegister) {
      return {
        isLimitedConnection,
        isTouchDevice,
        isRegistered: false,
        unregister: () => {},
      }
    }

    const previousElementData = this.elements.get(options.element)
    if (previousElementData) {
      previousElementData.registerCount++
      return {
        isLimitedConnection,
        isTouchDevice,
        isRegistered: false,
        unregister: () => {},
      }
    }

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    const elementData = createElementData(
      options,
      this.generateId(),
      this._globalSettings.defaultHitSlop
    )

    this.elements.set(options.element, elementData)
    this.activeElementCount++
    this.updateCheckableStatus(elementData)
    this.handler.observeElement(options.element)

    this.eventEmitter.emit({
      type: "elementRegistered",
      timestamp: Date.now(),
      elementData,
    })

    return {
      isTouchDevice,
      isLimitedConnection,
      isRegistered: true,
      unregister: () => {
        this.unregister(options.element)
      },
    }
  }

  public unregister(element: ForesightElement, unregisterReason?: ElementUnregisteredReason): void {
    const elementData = this.elements.get(element)
    if (!elementData) {
      return
    }

    this.clearReactivateTimeout(elementData)
    this.handler.unobserveElement(element)
    this.elements.delete(element)
    this.checkableElements.delete(elementData)

    if (elementData.callbackInfo.isCallbackActive) {
      this.activeElementCount--
    }

    const wasLastRegisteredElement = this.elements.size === 0 && this.isSetup
    if (wasLastRegisteredElement) {
      this.devLog("All elements unregistered, removing global listeners")
      this.removeGlobalListeners()
    }

    this.eventEmitter.emit({
      type: "elementUnregistered",
      elementData,
      timestamp: Date.now(),
      unregisterReason: unregisterReason ?? "by user",
      wasLastRegisteredElement,
    })
  }

  public reactivate(element: ForesightElement): void {
    const elementData = this.elements.get(element)
    if (!elementData) {
      return
    }

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    this.clearReactivateTimeout(elementData)

    if (!elementData.callbackInfo.isRunningCallback) {
      elementData.callbackInfo.isCallbackActive = true
      this.activeElementCount++
      this.updateCheckableStatus(elementData)
      this.handler.observeElement(element)
      this.eventEmitter.emit({
        type: "elementReactivated",
        elementData,
        timestamp: Date.now(),
      })
    }
  }

  private clearReactivateTimeout(elementData: ForesightElementData): void {
    clearTimeout(elementData.callbackInfo.reactivateTimeoutId)
    elementData.callbackInfo.reactivateTimeoutId = undefined
  }

  public updateCheckableStatus(elementData: ForesightElementData): void {
    const isCheckable =
      elementData.isIntersectingWithViewport &&
      elementData.callbackInfo.isCallbackActive &&
      !elementData.callbackInfo.isRunningCallback

    if (isCheckable) {
      this.checkableElements.add(elementData)
    } else {
      this.checkableElements.delete(elementData)
    }
  }

  private callCallback(elementData: ForesightElementData, callbackHitType: CallbackHitType): void {
    if (elementData.callbackInfo.isRunningCallback || !elementData.callbackInfo.isCallbackActive) {
      return
    }

    this.markElementAsRunning(elementData)
    this.executeCallbackAsync(elementData, callbackHitType)
  }

  private markElementAsRunning(elementData: ForesightElementData): void {
    elementData.callbackInfo.callbackFiredCount++
    elementData.callbackInfo.lastCallbackInvokedAt = Date.now()
    elementData.callbackInfo.isRunningCallback = true
    this.clearReactivateTimeout(elementData)
    this.checkableElements.delete(elementData)
  }

  private async executeCallbackAsync(
    elementData: ForesightElementData,
    callbackHitType: CallbackHitType
  ): Promise<void> {
    this.updateHitCounters(callbackHitType)
    this.eventEmitter.emit({
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
      console.error(`Error in callback for element ${elementData.name}:`, error)
    }

    this.finalizeCallback(elementData, callbackHitType, start, status, errorMessage)
  }

  private finalizeCallback(
    elementData: ForesightElementData,
    callbackHitType: CallbackHitType,
    startTime: number,
    status: callbackStatus,
    errorMessage: string | null
  ): void {
    elementData.callbackInfo.lastCallbackCompletedAt = Date.now()
    elementData.callbackInfo.isRunningCallback = false
    elementData.callbackInfo.isCallbackActive = false
    this.activeElementCount--
    this.handler.unobserveElement(elementData.element)

    if (elementData.callbackInfo.reactivateAfter !== Infinity) {
      elementData.callbackInfo.reactivateTimeoutId = setTimeout(() => {
        this.reactivate(elementData.element)
      }, elementData.callbackInfo.reactivateAfter)
    }

    const isLastActiveElement = this.activeElementCount === 0
    if (isLastActiveElement) {
      this.devLog("All elements unactivated, removing global listeners")
      this.removeGlobalListeners()
    }

    this.eventEmitter.emit({
      type: "callbackCompleted",
      timestamp: Date.now(),
      elementData,
      hitType: callbackHitType,
      elapsed: (elementData.callbackInfo.lastCallbackRuntime = performance.now() - startTime),
      status: (elementData.callbackInfo.lastCallbackStatus = status),
      errorMessage: (elementData.callbackInfo.lastCallbackErrorMessage = errorMessage),
      wasLastActiveElement: isLastActiveElement,
    })
  }

  private updateHitCounters(callbackHitType: CallbackHitType): void {
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
      case "touch":
        this._globalCallbackHits.touch++
        break
      case "viewport":
        this._globalCallbackHits.viewport++
        break
      default:
        callbackHitType satisfies never
    }
    this._globalCallbackHits.total++
  }

  private setDeviceStrategy(strategy: CurrentDeviceStrategy): void {
    const previousStrategy = this.handler instanceof DesktopHandler ? "mouse" : "touch"
    if (previousStrategy !== strategy) {
      this.devLog(`Switching device strategy from ${previousStrategy} to ${strategy}`)
    }

    this.handler.disconnect()
    this.handler = strategy === "mouse" ? this.desktopHandler : this.touchDeviceHandler
    this.handler.connect()
  }

  private handlePointerMove = (e: PointerEvent): void => {
    this.pendingPointerEvent = e

    if (e.pointerType !== this.currentDeviceStrategy) {
      this.eventEmitter.emit({
        type: "deviceStrategyChanged",
        timestamp: Date.now(),
        newStrategy: e.pointerType as CurrentDeviceStrategy,
        oldStrategy: this.currentDeviceStrategy,
      })
      this.setDeviceStrategy((this.currentDeviceStrategy = e.pointerType as CurrentDeviceStrategy))
    }

    if (this.rafId) {
      return
    }

    this.rafId = requestAnimationFrame(() => {
      if (this.handler instanceof TouchDeviceHandler) {
        this.rafId = null
        return
      }

      if (this.pendingPointerEvent) {
        this.handler.processMouseMovement(this.pendingPointerEvent)
      }
      this.rafId = null
    })
  }

  private initializeGlobalListeners(): void {
    if (this.isSetup || typeof document === "undefined") {
      return
    }

    this.devLog("Initializing global listeners (pointermove, MutationObserver)")
    this.setDeviceStrategy(this.currentDeviceStrategy)

    document.addEventListener("pointermove", this.handlePointerMove)

    this.domObserver = new MutationObserver(this.handleDomMutations)
    this.domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
    })

    this.isSetup = true
  }

  private removeGlobalListeners(): void {
    if (typeof document === "undefined") {
      return
    }

    this.isSetup = false
    this.domObserver?.disconnect()
    this.domObserver = null

    document.removeEventListener("pointermove", this.handlePointerMove)
    this.handler.disconnect()

    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.pendingPointerEvent = null
  }

  private handleDomMutations = (mutationsList: MutationRecord[]): void => {
    if (!mutationsList.length) {
      return
    }

    this.desktopHandler?.invalidateTabCache()

    let hasRemovedNodes = false
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i]
      if (mutation && mutation.type === "childList" && mutation.removedNodes.length > 0) {
        hasRemovedNodes = true
        break
      }
    }

    if (!hasRemovedNodes) {
      return
    }

    for (const element of this.elements.keys()) {
      if (!element.isConnected) {
        this.unregister(element, "disconnected")
      }
    }
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerSettings>): void {
    const result = applySettingsChanges(this._globalSettings, props)

    if (result.positionHistorySizeChanged) {
      this.desktopHandler.trajectoryPositions.positions.resize(
        this._globalSettings.positionHistorySize
      )
    }

    if (result.scrollPredictionChanged && this.handler instanceof DesktopHandler) {
      if (this._globalSettings.enableScrollPrediction) {
        this.handler.connectScrollPredictor()
      } else {
        this.handler.disconnectScrollPredictor()
      }
    }

    if (result.tabPredictionChanged && this.handler instanceof DesktopHandler) {
      if (this._globalSettings.enableTabPrediction) {
        this.handler.connectTabPredictor()
      } else {
        this.handler.disconnectTabPredictor()
      }
    }

    if (result.hitSlopChanged) {
      this.forceUpdateAllElementBounds()
    }

    if (result.touchStrategyChanged && this.handler instanceof TouchDeviceHandler) {
      this.handler.setTouchPredictor()
    }

    if (result.changedSettings.length > 0) {
      this.eventEmitter.emit({
        type: "managerSettingsChanged",
        timestamp: Date.now(),
        managerData: this.getManagerData,
        updatedSettings: result.changedSettings,
      })
    }
  }

  private forceUpdateAllElementBounds(): void {
    for (const elementData of this.elements.values()) {
      if (elementData.isIntersectingWithViewport) {
        this.forceUpdateElementBounds(elementData)
      }
    }
  }

  /**
   * ONLY use this function when you want to change the rect bounds via code, if the rects are changing because of updates in the DOM do not use this function.
   * We need an observer for that
   */
  private forceUpdateElementBounds(elementData: ForesightElementData): void {
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

      this.eventEmitter.emit({
        type: "elementDataUpdated",
        elementData: updatedElementData,
        updatedProps: ["bounds" as const],
      })
    }
  }

  private devLog(message: string): void {
    if (this._globalSettings.enableManagerLogging) {
      console.log(`%c🛠️ ForesightManager: ${message}`, "color: #16a34a; font-weight: bold;")
    }
  }
}
