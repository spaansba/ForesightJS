import { DerivedMapView } from "../helpers/DerivedMapView"
import { devLogMessage } from "../helpers/devLog"
import { areRectsEqual, getExpandedRect, normalizeHitSlop } from "../helpers/rectAndHitSlop"
import { hasConnectionLimitations, userUsesTouchDevice } from "../helpers/shouldRegister"
import {
  createDefaultManagerSettings,
  createElementInternal,
  createInitialCallbackHits,
} from "../helpers/createInitialState"
import { ForesightEventEmitter } from "../core/ForesightEventEmitter"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import type { ElementObservingModule } from "../core/ElementObservingModule"
import { applySettingsChanges } from "./SettingsManager"
import type {
  CallbackHits,
  CallbackHitType,
  callbackStatus,
  CurrentDeviceStrategy,
  ElementBounds,
  ElementUnregisteredReason,
  ForesightElement,
  ForesightElementInternal,
  ForesightElementState,
  ForesightEvent,
  ForesightEventListener,
  ForesightManagerData,
  ForesightManagerSettings,
  ForesightModules,
  ForesightRegisterNodeListOptions,
  ForesightRegisterOptions,
  ForesightRegisterOptionsWithoutElement,
  ForesightRegisterResult,
  UpdateForsightManagerSettings,
} from "../types/types"
import type { DesktopHandler } from "./DesktopHandler"
import type { TouchDeviceHandler } from "./TouchDeviceHandler"

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

  private idCounter: number = 0
  private activeElementCount: number = 0
  private parkedElementCount: number = 0

  private desktopHandler: DesktopHandler | null = null
  private touchDeviceHandler: TouchDeviceHandler | null = null
  private currentlyActiveHandler: ElementObservingModule | null = null
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
    // Side-effect flags in the result are no-ops here: handlers are still null
    // and the settings-changed event only fires from alterGlobalSettings.
    applySettingsChanges(this._globalSettings, initialSettings)

    this.handlerDependencies = {
      elements: this.elementEntries,
      callCallback: this.callCallback.bind(this),
      emit: this.eventEmitter.emit.bind(this.eventEmitter),
      hasListeners: this.eventEmitter.hasListeners.bind(this.eventEmitter),
      updateElementState: this.updateElementState.bind(this),
      updateElementBounds: this.updateElementBounds.bind(this),
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

  /**
   * Subscribe to logical state changes for a specific element.
   * The listener is called (with no arguments) whenever the element's
   * immutable state snapshot is replaced. Never fires for geometry-only
   * changes (scroll/resize) - see {@link subscribeToElementBounds}.
   * Use {@link registeredElements} to read the latest state inside the listener.
   *
   * @returns An unsubscribe function, or `undefined` if the element is not registered.
   */
  public subscribeToElement(
    element: ForesightElement,
    listener: () => void
  ): (() => void) | undefined {
    const entry = this.elementEntries.get(element)
    if (!entry) {
      return undefined
    }

    return this.makeSubscribe(entry.subscribers)(listener)
  }

  /**
   * Subscribe to geometry changes for a specific element (position/size, fired
   * on every scroll/resize tick while visible). Use {@link getElementBounds}
   * to read the latest geometry inside the listener.
   *
   * @returns An unsubscribe function, or `undefined` if the element is not registered.
   */
  public subscribeToElementBounds(
    element: ForesightElement,
    listener: () => void
  ): (() => void) | undefined {
    const entry = this.elementEntries.get(element)
    if (!entry) {
      return undefined
    }

    return this.makeSubscribe(entry.boundsSubscribers)(listener)
  }

  /**
   * Returns the current immutable geometry snapshot for a registered element,
   * or `undefined` if the element is not registered.
   */
  public getElementBounds(element: ForesightElement): ElementBounds | undefined {
    return this.elementEntries.get(element)?.bounds
  }

  public get getManagerData(): Readonly<ForesightManagerData> {
    return {
      registeredElements: this.registeredElements,
      globalSettings: this._globalSettings,
      globalCallbackHits: this._globalCallbackHits,
      eventListeners: this.eventEmitter.getEventListeners(),
      currentDeviceStrategy: this.currentDeviceStrategy,
      activeElementCount: this.activeElementCount,
      parkedElementCount: this.parkedElementCount,
      loadedModules: this.getLoadedModulesSnapshot(),
    }
  }

  private getLoadedModulesSnapshot(): ForesightModules {
    const desktopPredictors = this.desktopHandler?.loadedPredictors
    const touchPredictors = this.touchDeviceHandler?.loadedPredictors

    return {
      desktopHandler: this.desktopHandler !== null,
      touchHandler: this.touchDeviceHandler !== null,
      predictors: {
        mouse: desktopPredictors?.mouse ?? false,
        tab: desktopPredictors?.tab ?? false,
        scroll: desktopPredictors?.scroll ?? false,
        viewport: touchPredictors?.viewport ?? false,
        touchStart: touchPredictors?.touchStart ?? false,
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
    // On a limited connection (data saver / slow network) the element is
    // registered so it can be patched and tracked, but stays inactive (never
    // predicted, never fires its callback) to avoid consuming data.
    // See createElementInternal / setElementEnabled.
    const isLimitedConnection = hasConnectionLimitations(this._globalSettings.minimumConnectionType)

    const previousEntry = this.elementEntries.get(options.element)

    if (previousEntry) {
      this.updateElementOptions(options.element, options)
      this.updateElementState(previousEntry, {
        registerCount: previousEntry.state.registerCount + 1,
      })

      return this.buildRegisterResult(previousEntry, options.element)
    }

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    const entry = createElementInternal(
      options,
      this.generateId(),
      this._globalSettings.defaultHitSlop,
      isLimitedConnection
    )

    this.elementEntries.set(options.element, entry)

    // Inactive elements (disabled or limited connection) are not observed or
    // counted as active until they are (re)activated.
    if (entry.state.isActive) {
      this.activeElementCount++
      this.currentlyActiveHandler?.observeElement(options.element)
    }

    this.eventEmitter.emit({
      type: "elementRegistered",
      timestamp: Date.now(),
      element: options.element,
      state: entry.state,
    })

    return this.buildRegisterResult(entry, options.element)
  }

  private buildRegisterResult(
    entry: ForesightElementInternal,
    element: ForesightElement
  ): ForesightRegisterResult {
    return {
      ...entry.state,
      unregister: () => {
        this.unregister(element)
      },
      subscribe: this.makeSubscribe(entry.subscribers),
      getSnapshot: () => entry.state,
      subscribeToBounds: this.makeSubscribe(entry.boundsSubscribers),
      getBounds: () => entry.bounds,
    }
  }

  /**
   * Updates the options of an already-registered element.
   * Only the provided fields are updated; omitted fields keep their current values.
   * If a reactivation timeout is pending and reactivateAfter changed, the timeout is rescheduled.
   *
   * @throws Error if the element is not registered.
   */
  public updateElementOptions(
    element: ForesightElement,
    options: Partial<ForesightRegisterOptionsWithoutElement>
  ): ForesightElementState {
    const entry = this.elementEntries.get(element)
    if (!entry) {
      throw new Error("Cannot update options: element is not registered.")
    }

    if (options.callback) {
      entry.callback = options.callback
    }

    if (options.enabled !== undefined) {
      this.setElementEnabled(entry, element, options.enabled !== false)
    }

    // Keep the current hitSlop reference when it is omitted or content-equal,
    // so updateElementState sees no change; otherwise remeasure and re-expand.
    // Bounds are updated BEFORE state so state subscribers read fresh geometry.
    let hitSlop = entry.state.hitSlop
    if (options.hitSlop !== undefined) {
      const normalized = normalizeHitSlop(options.hitSlop)
      if (!areRectsEqual(normalized, hitSlop)) {
        hitSlop = normalized
        const originalRect = element.getBoundingClientRect()
        this.updateElementBounds(entry, {
          originalRect,
          expandedRect: getExpandedRect(originalRect, hitSlop),
        })
      }
    }

    const prevReactivateAfter = entry.state.reactivateAfter
    const reactivateAfter = options.reactivateAfter ?? prevReactivateAfter
    const next = this.updateElementState(entry, {
      name: options.name || entry.state.name,
      meta: options.meta ?? entry.state.meta,
      reactivateAfter,
      hitSlop,
    })

    // Only clear and reschedule the reactivation timeout if reactivateAfter actually changed
    if (reactivateAfter !== prevReactivateAfter) {
      if (entry.reactivateTimeoutId !== undefined) {
        this.clearReactivateTimeout(entry)
      }

      if (reactivateAfter !== Infinity && next.isPredicted) {
        entry.reactivateTimeoutId = setTimeout(() => {
          this.reactivate(element)
        }, reactivateAfter)
      }
    }

    return next
  }

  /**
   * Create a subscribe function for a listener set (state or bounds subscribers).
   * Returns an unsubscribe callback when called.
   */
  private makeSubscribe(subscribers: Set<() => void>) {
    return (listener: () => void): (() => void) => {
      subscribers.add(listener)

      return () => {
        subscribers.delete(listener)
      }
    }
  }

  /**
   * Replace the immutable state ref for an element and notify subscribers.
   * No-op when every patch value already matches current state - preserves the
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
      try {
        listener()
      } catch (error) {
        console.error(`Error in element subscriber for ${next.name}:`, error)
      }
    }

    return next
  }

  /**
   * Replace the immutable geometry ref for an element and notify bounds
   * subscribers. No-op when both rects are content-equal. Preserves the
   * stable-reference contract, mirroring {@link updateElementState}.
   *
   * When a single trigger changes both geometry and logical state (position
   * change, hitSlop update), bounds must be updated BEFORE the state patch so
   * state subscribers always read fresh geometry.
   */
  private updateElementBounds(entry: ForesightElementInternal, next: ElementBounds): ElementBounds {
    const current = entry.bounds
    if (
      areRectsEqual(next.originalRect, current.originalRect) &&
      areRectsEqual(next.expandedRect, current.expandedRect)
    ) {
      return current
    }

    entry.bounds = next
    for (const listener of entry.boundsSubscribers) {
      try {
        listener()
      } catch (error) {
        console.error(`Error in element bounds subscriber for ${entry.state.name}:`, error)
      }
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

    if (entry.state.isParked) {
      this.parkedElementCount--
    }

    const finalState = this.updateElementState(entry, {
      isRegistered: false,
      isActive: false,
      isParked: false,
      isPredicted: false,
      isCallbackRunning: false,
    })

    this.elementEntries.delete(element)
    entry.subscribers.clear()
    entry.boundsSubscribers.clear()

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
    if (!entry || !entry.state.isEnabled) {
      return
    }

    if (!this.isSetup) {
      this.initializeGlobalListeners()
    }

    this.clearReactivateTimeout(entry)

    if (entry.state.isCallbackRunning || entry.state.isActive) {
      return
    }

    this.updateElementState(entry, { isActive: true, isPredicted: false })
    this.activeElementCount++
    this.currentlyActiveHandler?.observeElement(element)
  }

  /**
   * Toggle prediction for a registered element without unregistering it.
   * Disabling deactivates and stops observing; enabling reactivates it.
   */
  private setElementEnabled(
    entry: ForesightElementInternal,
    element: ForesightElement,
    enabled: boolean
  ): void {
    if (entry.state.isEnabled === enabled) {
      return
    }

    // A limited connection keeps the element inactive even when enabled (a data
    // saver never starts firing just because enabled flipped); a parked element
    // (detached from the DOM) stays inactive until it reconnects.
    const isActive = enabled && !entry.state.isLimitedConnection && !entry.state.isParked

    if (isActive) {
      // Global listeners may have been torn down when the active count last hit
      // zero; re-arm them so prediction actually resumes.
      if (!this.isSetup) {
        this.initializeGlobalListeners()
      }

      this.activeElementCount++
      this.currentlyActiveHandler?.observeElement(element)
    } else {
      this.clearReactivateTimeout(entry)
      this.currentlyActiveHandler?.unobserveElement(element)
      if (entry.state.isActive) {
        this.activeElementCount--
      }
    }

    this.updateElementState(entry, {
      isEnabled: enabled,
      isActive,
      isPredicted: false,
      isCallbackRunning: false,
    })

    // Disabling the last active element leaves nothing to predict on.
    this.removeGlobalListenersIfIdle()
  }

  private clearReactivateTimeout(entry: ForesightElementInternal): void {
    clearTimeout(entry.reactivateTimeoutId)
    entry.reactivateTimeoutId = undefined
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
    this.removeGlobalListenersIfIdle()

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

    let hasChildListChange = false
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i]
      if (
        mutation &&
        mutation.type === "childList" &&
        (mutation.removedNodes.length > 0 || mutation.addedNodes.length > 0)
      ) {
        hasChildListChange = true
        break
      }
    }

    if (!hasChildListChange) {
      return
    }

    for (const entry of this.elementEntries.values()) {
      if (entry.state.isParked) {
        if (entry.element.isConnected) {
          this.resumeReconnected(entry)
        }
      } else if (!entry.element.isConnected) {
        this.parkDisconnected(entry)
      }
    }
  }

  /**
   * Deactivate an element that was detached from the DOM. It is kept in
   * {@link elementEntries} (still registered) and flagged `isParked` so it can be
   * resumed when it reconnects.
   */
  private parkDisconnected(entry: ForesightElementInternal): void {
    this.clearReactivateTimeout(entry)
    this.currentlyActiveHandler?.unobserveElement(entry.element)
    if (entry.state.isActive) {
      this.activeElementCount--
    }

    this.parkedElementCount++
    // Preserve `isPredicted`: an element that already fired its callback must stay
    // "fired" so it is not treated as fresh (and reactivated) when it reconnects.
    this.updateElementState(entry, {
      isActive: false,
      isCallbackRunning: false,
      isParked: true,
    })
  }

  /**
   * Re-activate a previously parked element once it is back in the DOM. Mirrors
   * the activation rules used everywhere else: disabled / limited connections stay
   * inactive, and an element that already fired its callback stays inactive too
   * (it resumes the same state it had before it detached).
   */
  private resumeReconnected(entry: ForesightElementInternal): void {
    this.parkedElementCount--

    const eligible = entry.state.isEnabled && !entry.state.isLimitedConnection
    // Only resume as active if it was active before detaching. A fired element
    // (isPredicted) was already inactive, so it stays inactive on reconnect.
    const isActive = eligible && !entry.state.isPredicted
    if (isActive) {
      if (!this.isSetup) {
        this.initializeGlobalListeners()
      }

      this.activeElementCount++
      this.currentlyActiveHandler?.observeElement(entry.element)
    }

    this.updateElementState(entry, { isActive, isParked: false })

    // If it fired with a finite reactivateAfter, resume the reactivation timer that
    // was cleared when it parked, so the cooldown continues from reconnect.
    if (eligible && entry.state.isPredicted && entry.state.reactivateAfter !== Infinity) {
      entry.reactivateTimeoutId = setTimeout(() => {
        this.reactivate(entry.element)
      }, entry.state.reactivateAfter)
    }
  }

  /**
   * Tear down global listeners only when nothing needs them: no active elements
   * to predict on, and no parked elements waiting to reconnect (which need the
   * MutationObserver to detect their return).
   */
  private removeGlobalListenersIfIdle(): void {
    if (this.activeElementCount > 0 || this.parkedElementCount > 0) {
      return
    }

    this.removeGlobalListeners()
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

    this.updateElementBounds(entry, {
      originalRect: newOriginalRect,
      expandedRect: getExpandedRect(newOriginalRect, entry.state.hitSlop),
    })
  }

  private devLog(message: string): void {
    if (this._globalSettings.enableManagerLogging) {
      devLogMessage("🛠️ ForesightManager", message, "#16a34a")
    }
  }
}
