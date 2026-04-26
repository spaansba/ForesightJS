import { DerivedMapView } from "../helpers/DerivedMapView"
import { areRectsEqual, getExpandedRect } from "../helpers/rectAndHitSlop"
import { evaluateRegistrationConditions, userUsesTouchDevice } from "../helpers/shouldRegister"
import {
  createBlockedSnapshot,
  createDefaultManagerSettings,
  createElementInternal,
  createInitialCallbackHits,
} from "../helpers/createInitialState"
import { ForesightEventEmitter } from "../core/ForesightEventEmitter"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import { applySettingsChanges, initializeSettings } from "./SettingsManager"
import type {
  CallbackHits,
  CallbackHitType,
  callbackStatus,
  CurrentDeviceStrategy,
  ElementUnregisteredReason,
  ForesightElement,
  ForesightElementInternal,
  ForesightElementState,
  ForesightEvent,
  ForesightEventListener,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightRegisterNodeListOptions,
  ForesightRegisterOptions,
  ForesightRegisterResult,
  UpdateForsightManagerSettings,
} from "../types/types"
import type { DesktopHandler } from "./DesktopHandler"
import type { TouchDeviceHandler } from "./TouchDeviceHandler"

const NOOP_UNSUBSCRIBE = () => {}

/**
 * Manages the prediction of user intent based on mouse trajectory and element interactions.
 *
 * ForesightManager is a singleton class responsible for:
 * - Registering HTML elements to monitor.
 * - Tracking mouse movements and predicting future cursor positions.
 * - Detecting when a predicted trajectory intersects with a registered element's bounds.
 * - Invoking callbacks associated with elements upon predicted or actual interaction.
 * - Deactivating elements after their callback completes, with optional reactivation via `reactivateAfter`.
 * - Handling global settings for prediction behavior (e.g., history size, prediction time).
 * - Delegating element bounds observation to device handlers ({@link DesktopHandler}, {@link TouchDeviceHandler}).
 * - Automatically unregistering elements removed from the DOM using {@link MutationObserver}.
 * - Detecting broader layout shifts via {@link MutationObserver} to update element positions.
 *
 * It should be initialized once using {@link ForesightManager.initialize} and then
 * accessed via the static getter {@link ForesightManager.instance}.
 */
export class ForesightManager {
  private static manager: ForesightManager

  /** Internal entries containing full element data, callbacks, and subscribers. */
  private elementEntries: Map<ForesightElement, ForesightElementInternal> = new Map()
  /** Public read-only view exposing only external state, derived from {@link elementEntries}. */
  public readonly registeredElements: ReadonlyMap<ForesightElement, ForesightElementState> =
    new DerivedMapView(this.elementEntries, (entry: ForesightElementInternal) => entry.state)

  private checkableElements: Set<ForesightElementInternal> = new Set()

  private idCounter: number = 0
  private activeElementCount: number = 0

  private desktopHandler: DesktopHandler | null = null
  private touchDeviceHandler: TouchDeviceHandler | null = null
  private currentlyActiveHandler: DesktopHandler | TouchDeviceHandler | null = null
  private handlerDependencies: ForesightModuleDependencies

  private isSetup: boolean = false
  private pendingPointerEvent: PointerEvent | null = null
  private rafId: number | null = null
  private domObserver: MutationObserver | null = null
  private currentDeviceStrategy: CurrentDeviceStrategy = userUsesTouchDevice() ? "touch" : "mouse"

  private eventEmitter = new ForesightEventEmitter()
  private _globalCallbackHits: CallbackHits = createInitialCallbackHits()
  private _globalSettings: ForesightManagerSettings = createDefaultManagerSettings()

  private constructor(initialSettings?: Partial<UpdateForsightManagerSettings>) {
    if (initialSettings !== undefined) {
      initializeSettings(this._globalSettings, initialSettings)
    }

    this.handlerDependencies = {
      elements: this.elementEntries,
      callCallback: this.callCallback.bind(this),
      emit: this.eventEmitter.emit.bind(this.eventEmitter),
      hasListeners: this.eventEmitter.hasListeners.bind(this.eventEmitter),
      updateElementState: this.updateElementState.bind(this),
      settings: this._globalSettings,
    }

    // Handlers are created lazily when first needed as of 3.4.0
    this.devLog(`ForesightManager initialized with device strategy: ${this.currentDeviceStrategy}`)
    this.initializeGlobalListeners()
  }

  private async getOrCreateDesktopHandler(): Promise<DesktopHandler> {
    if (!this.desktopHandler) {
      const { DesktopHandler } = await import("./DesktopHandler")
      this.desktopHandler = new DesktopHandler(this.handlerDependencies)
      this.devLog("DesktopHandler lazy loaded")
    }

    return this.desktopHandler
  }

  private async getOrCreateTouchHandler(): Promise<TouchDeviceHandler> {
    if (!this.touchDeviceHandler) {
      const { TouchDeviceHandler } = await import("./TouchDeviceHandler")
      this.touchDeviceHandler = new TouchDeviceHandler(this.handlerDependencies)
      this.devLog("TouchDeviceHandler lazy loaded")
    }

    return this.touchDeviceHandler
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

  private get isUsingDesktopHandler(): boolean {
    return this.currentDeviceStrategy === "mouse" || this.currentDeviceStrategy === "pen"
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
    const desktopPredictors = this.desktopHandler?.loadedPredictors
    const touchPredictors = this.touchDeviceHandler?.loadedPredictors

    return {
      registeredElements: this.registeredElements,
      globalSettings: this._globalSettings,
      globalCallbackHits: this._globalCallbackHits,
      eventListeners: this.eventEmitter.getEventListeners(),
      currentDeviceStrategy: this.currentDeviceStrategy,
      activeElementCount: this.activeElementCount,
      loadedModules: {
        desktopHandler: this.desktopHandler !== null,
        touchHandler: this.touchDeviceHandler !== null,
        predictors: {
          mouse: desktopPredictors?.mouse ?? false,
          tab: desktopPredictors?.tab ?? false,
          scroll: desktopPredictors?.scroll ?? false,
          viewport: touchPredictors?.viewport ?? false,
          touchStart: touchPredictors?.touchStart ?? false,
        },
      },
    }
  }

  public register(options: ForesightRegisterNodeListOptions): ForesightRegisterResult[]
  public register(options: ForesightRegisterOptions): ForesightRegisterResult
  public register(
    options: ForesightRegisterOptions | ForesightRegisterNodeListOptions
  ): ForesightRegisterResult | ForesightRegisterResult[] {
    const { element: elements, ...rest } = options

    if (elements instanceof NodeList) {
      return Array.from(elements, element => this.registerElement({ ...rest, element }))
    }

    return this.registerElement({ ...rest, element: elements })
  }

  private registerElement(options: ForesightRegisterOptions): ForesightRegisterResult {
    const { isLimitedConnection, shouldRegister } = evaluateRegistrationConditions()

    if (!shouldRegister) {
      const blocked = createBlockedSnapshot(isLimitedConnection)
      return {
        ...blocked,
        unregister: () => {},
        subscribe: () => NOOP_UNSUBSCRIBE,
        getSnapshot: () => blocked,
      }
    }

    const previousEntry = this.elementEntries.get(options.element)

    if (previousEntry) {
      return this.reRegisterElement(previousEntry, options)
    }

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    const entry = createElementInternal(
      options,
      this.generateId(),
      this._globalSettings.defaultHitSlop
    )

    this.elementEntries.set(options.element, entry)
    this.activeElementCount++
    this.updateCheckableStatus(entry)
    this.currentlyActiveHandler?.observeElement(options.element)

    this.eventEmitter.emit({
      type: "elementRegistered",
      timestamp: Date.now(),
      element: options.element,
      state: entry.state,
    })

    return {
      ...entry.state,
      unregister: () => {
        this.unregister(options.element)
      },
      subscribe: this.makeSubscribe(entry),
      getSnapshot: () => entry.state,
    }
  }

  /**
   * Handles re-registration of an already registered element.
   * Updates the entry's callback, name, meta, and reactivateAfter from the new options,
   * falling back to the existing values when an option is omitted.
   * If a reactivation timeout is pending and reactivateAfter changed, the timeout is rescheduled.
   */
  private reRegisterElement(
    entry: ForesightElementInternal,
    options: ForesightRegisterOptions
  ): ForesightRegisterResult {
    entry.callback = options.callback

    const reactivateAfter = options.reactivateAfter ?? entry.state.reactivateAfter
    const next = this.updateElementState(entry, {
      registerCount: entry.state.registerCount + 1,
      name: options.name || entry.state.name,
      meta: options.meta ?? entry.state.meta,
      reactivateAfter,
    })

    // Reschedule the reactivation timeout if reactivateAfter changed while waiting
    if (entry.reactivateTimeoutId !== undefined) {
      this.clearReactivateTimeout(entry)
      if (reactivateAfter !== Infinity) {
        entry.reactivateTimeoutId = setTimeout(() => {
          this.reactivate(options.element)
        }, reactivateAfter)
      }
    }

    return {
      ...next,
      unregister: () => {},
      subscribe: this.makeSubscribe(entry),
      getSnapshot: () => entry.state,
    }
  }

  /**
   * Create a subscribe function for an element.
   * Returns an unsubscribe callback when called.
   */
  private makeSubscribe(entry: ForesightElementInternal) {
    return (listener: () => void): (() => void) => {
      entry.subscribers.add(listener)

      return () => {
        entry.subscribers.delete(listener)
      }
    }
  }

  /**
   * Replace the immutable state ref for an element and notify subscribers.
   * No-op when every patch value already matches current state — preserves the
   * stable-reference contract relied on by useSyncExternalStore and shallowRef.
   */
  private updateElementState(
    entry: ForesightElementInternal,
    patch: Partial<ForesightElementState>
  ): ForesightElementState {
    const current = entry.state
    let changed = false
    for (const key in patch) {
      if (
        patch[key as keyof ForesightElementState] !== current[key as keyof ForesightElementState]
      ) {
        changed = true
        break
      }
    }
    if (!changed) {
      return current
    }

    const next = { ...current, ...patch }
    entry.state = next
    for (const listener of entry.subscribers) {
      listener()
    }
    return next
  }

  public unregister(
    element: ForesightElement | NodeListOf<ForesightElement>,
    unregisterReason?: ElementUnregisteredReason
  ): void {
    if (element instanceof NodeList) {
      element.forEach(el => this.unregisterElement(el, unregisterReason))
    } else {
      this.unregisterElement(element, unregisterReason)
    }
  }

  private unregisterElement(
    element: ForesightElement,
    unregisterReason?: ElementUnregisteredReason
  ): void {
    const entry = this.elementEntries.get(element)
    if (!entry) {
      return
    }

    this.clearReactivateTimeout(entry)
    this.currentlyActiveHandler?.unobserveElement(element)

    if (entry.state.isActive) {
      this.activeElementCount--
    }

    const finalState = this.updateElementState(entry, {
      isRegistered: false,
      isActive: false,
      isPredicted: false,
      isCallbackRunning: false,
    })

    this.elementEntries.delete(element)
    this.checkableElements.delete(entry)
    entry.subscribers.clear()

    const wasLastRegisteredElement = this.elementEntries.size === 0 && this.isSetup
    if (wasLastRegisteredElement) {
      this.devLog("All elements unregistered, removing global listeners")
      this.removeGlobalListeners()
    }

    this.eventEmitter.emit({
      type: "elementUnregistered",
      element: element,
      state: finalState,
      timestamp: Date.now(),
      unregisterReason: unregisterReason ?? "by user",
      wasLastRegisteredElement,
    })
  }

  public reactivate(element: ForesightElement | NodeListOf<ForesightElement>): void {
    if (element instanceof NodeList) {
      element.forEach(el => this.reactivateElement(el))
    } else {
      this.reactivateElement(element)
    }
  }

  private reactivateElement(element: ForesightElement): void {
    const entry = this.elementEntries.get(element)
    if (!entry) {
      return
    }

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    this.clearReactivateTimeout(entry)

    if (entry.state.isCallbackRunning || entry.state.isActive) {
      return
    }

    const next = this.updateElementState(entry, { isActive: true, isPredicted: false })
    this.activeElementCount++
    this.updateCheckableStatus(entry)
    this.currentlyActiveHandler?.observeElement(element)

    this.eventEmitter.emit({
      type: "elementReactivated",
      element: element,
      state: next,
      timestamp: Date.now(),
    })
  }

  private clearReactivateTimeout(entry: ForesightElementInternal): void {
    clearTimeout(entry.reactivateTimeoutId)
    entry.reactivateTimeoutId = undefined
  }

  public updateCheckableStatus(entry: ForesightElementInternal): void {
    const state = entry.state
    const isCheckable = state.isIntersectingWithViewport && state.isActive && !state.isPredicted

    if (isCheckable) {
      this.checkableElements.add(entry)
    } else {
      this.checkableElements.delete(entry)
    }
  }

  private callCallback(entry: ForesightElementInternal, callbackHitType: CallbackHitType): void {
    if (entry.state.isPredicted || !entry.state.isActive) {
      return
    }

    this.markElementAsRunning(entry)
    this.executeCallbackAsync(entry, callbackHitType)
  }

  private markElementAsRunning(entry: ForesightElementInternal): void {
    this.clearReactivateTimeout(entry)
    this.checkableElements.delete(entry)

    entry.invokedAt = Date.now()

    this.updateElementState(entry, {
      isPredicted: true,
      isCallbackRunning: true,
      hitCount: entry.state.hitCount + 1,
    })
  }

  private async executeCallbackAsync(
    entry: ForesightElementInternal,
    callbackHitType: CallbackHitType
  ): Promise<void> {
    this.updateHitCounters(callbackHitType)

    this.eventEmitter.emit({
      type: "callbackInvoked",
      timestamp: Date.now(),
      element: entry.element,
      state: entry.state,
      hitType: callbackHitType,
    })

    const start = performance.now()
    let errorMessage: string | null = null

    try {
      await entry.callback(entry.state)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error in callback for element ${entry.state.name}:`, error)
    }

    const status: callbackStatus = errorMessage !== null ? "error" : "success"
    this.finalizeCallback(entry, callbackHitType, start, status, errorMessage)
  }

  private finalizeCallback(
    entry: ForesightElementInternal,
    callbackHitType: CallbackHitType,
    startTime: number,
    status: callbackStatus,
    errorMessage: string | null
  ): void {
    const elapsed = performance.now() - startTime

    if (entry.state.isActive) {
      this.activeElementCount--
    }

    this.currentlyActiveHandler?.unobserveElement(entry.element)

    entry.completedAt = Date.now()
    const next = this.updateElementState(entry, {
      isCallbackRunning: false,
      isActive: false,
      durationMs: elapsed,
      status,
      error: errorMessage,
    })

    if (next.reactivateAfter !== Infinity) {
      entry.reactivateTimeoutId = setTimeout(() => {
        this.reactivate(entry.element)
      }, next.reactivateAfter)
    }

    const isLastActiveElement = this.activeElementCount === 0
    if (isLastActiveElement) {
      this.devLog("All elements unactivated, removing global listeners")
      this.removeGlobalListeners()
    }

    this.eventEmitter.emit({
      type: "callbackCompleted",
      timestamp: Date.now(),
      element: entry.element,
      state: next,
      hitType: callbackHitType,
      elapsed,
      status,
      errorMessage,
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

  private async setDeviceStrategy(strategy: CurrentDeviceStrategy): Promise<void> {
    const previousStrategy = this.currentDeviceStrategy

    if (previousStrategy !== strategy) {
      this.devLog(`Switching device strategy from ${previousStrategy} to ${strategy}`)
    }

    this.currentlyActiveHandler?.disconnect()

    // Lazy load the handler
    this.currentlyActiveHandler =
      strategy === "mouse" || strategy === "pen"
        ? await this.getOrCreateDesktopHandler()
        : await this.getOrCreateTouchHandler()

    this.currentlyActiveHandler.connect()
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

      this.currentDeviceStrategy = e.pointerType as CurrentDeviceStrategy
      this.setDeviceStrategy(this.currentDeviceStrategy)
    }

    if (this.rafId) {
      return
    }

    this.rafId = requestAnimationFrame(() => {
      // Only process mouse movements for desktop handler (mouse/pen)
      if (!this.isUsingDesktopHandler) {
        this.rafId = null
        return
      }

      if (this.pendingPointerEvent) {
        this.desktopHandler?.processMouseMovement(this.pendingPointerEvent)
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
    this.currentlyActiveHandler?.disconnect()

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

    for (const element of this.elementEntries.keys()) {
      if (!element.isConnected) {
        this.unregister(element, "disconnected")
      }
    }
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerSettings>): void {
    const result = applySettingsChanges(this._globalSettings, props)

    if (result.positionHistorySizeChanged && this.desktopHandler) {
      this.desktopHandler.trajectoryPositions.positions.resize(
        this._globalSettings.positionHistorySize
      )
    }

    if (result.scrollPredictionChanged && this.isUsingDesktopHandler && this.desktopHandler) {
      if (this._globalSettings.enableScrollPrediction) {
        this.desktopHandler.connectScrollPredictor()
      } else {
        this.desktopHandler.disconnectScrollPredictor()
      }
    }

    if (result.tabPredictionChanged && this.isUsingDesktopHandler && this.desktopHandler) {
      if (this._globalSettings.enableTabPrediction) {
        this.desktopHandler.connectTabPredictor()
      } else {
        this.desktopHandler.disconnectTabPredictor()
      }
    }

    if (result.hitSlopChanged) {
      this.forceUpdateAllElementBounds()
    }

    if (result.touchStrategyChanged && !this.isUsingDesktopHandler && this.touchDeviceHandler) {
      this.touchDeviceHandler.setTouchPredictor()
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
    for (const entry of this.elementEntries.values()) {
      if (entry.state.isIntersectingWithViewport) {
        this.forceUpdateElementBounds(entry)
      }
    }
  }

  /**
   * ONLY use this function when you want to change the rect bounds via code, if the rects are changing because of updates in the DOM do not use this function.
   * We need an observer for that
   */
  private forceUpdateElementBounds(entry: ForesightElementInternal): void {
    const newOriginalRect = entry.element.getBoundingClientRect()
    const expandedRect = getExpandedRect(newOriginalRect, entry.state.elementBounds.hitSlop)

    if (areRectsEqual(expandedRect, entry.state.elementBounds.expandedRect)) {
      return
    }

    const next = this.updateElementState(entry, {
      elementBounds: {
        hitSlop: entry.state.elementBounds.hitSlop,
        originalRect: newOriginalRect,
        expandedRect,
      },
    })

    this.eventEmitter.emit({
      type: "elementDataUpdated",
      element: entry.element,
      state: next,
      updatedProps: ["bounds" as const],
    })
  }

  private devLog(message: string): void {
    if (this._globalSettings.enableManagerLogging) {
      console.log(`%c🛠️ ForesightManager: ${message}`, "color: #16a34a; font-weight: bold;")
    }
  }
}
