import { ForesightDebugger } from "./Debugger/ForesightDebugger"
import type {
  ForesightCallback,
  ForesightManagerProps,
  ForesightElementData,
  ForesightElement,
  MousePosition,
  Point,
  Rect,
} from "../types/types"

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
  public elements: Map<ForesightElement, ForesightElementData> = new Map()

  private isSetup: boolean = false
  private debugMode: boolean = false
  private debugger: ForesightDebugger | null = null

  private globalSettings: ForesightManagerProps = {
    debug: false,
    enableMousePrediction: true,
    positionHistorySize: 8,
    trajectoryPredictionTime: 80,
    defaultHitSlop: { top: 0, left: 0, right: 0, bottom: 0 },
    resizeScrollThrottleDelay: 50,
  }

  private positions: MousePosition[] = []
  private currentPoint: Point = { x: 0, y: 0 }
  private predictedPoint: Point = { x: 0, y: 0 }

  // Throttling for window resize/scroll triggered updates
  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null

  // For automatic unregistration and detecting layout shifts
  private domObserver: MutationObserver | null = null
  // Throttling for DOM mutation-triggered rect updates
  private lastDomMutationRectsUpdateTimestamp: number = 0
  private domMutationRectsUpdateTimeoutId: ReturnType<typeof setTimeout> | null = null

  // For observing individual element resizes
  private elementResizeObserver: ResizeObserver | null = null

  private constructor() {
    this.globalSettings.defaultHitSlop = this.normalizeHitSlop(this.globalSettings.defaultHitSlop)
    setInterval(this.checkTrajectoryHitExpiration.bind(this), 100)
  }

  /**
   * Initializes the ForesightManager singleton instance with optional global settings.
   */
  public static initialize(props?: Partial<ForesightManagerProps>): ForesightManager {
    if (!ForesightManager.manager) {
      ForesightManager.manager = new ForesightManager()
      if (props) {
        ForesightManager.manager.alterGlobalSettings(props)
      } else {
        // Ensure debugger is initialized if debug is true by default and no props are passed
        if (ForesightManager.manager.globalSettings.debug) {
          ForesightManager.manager.turnOnDebugMode()
        }
      }
    } else if (props) {
      console.warn(
        "ForesightManager is already initialized. Use alterGlobalSettings to update settings. Make sure to not put the ForesightManager.initialize() in a place that rerenders often."
      )
      ForesightManager.manager.alterGlobalSettings(props)
    }
    // Ensure debugMode property reflects the potentially updated globalSettings.debug
    ForesightManager.manager.debugMode = ForesightManager.manager.globalSettings.debug
    return ForesightManager.manager
  }

  /**
   * Gets the singleton instance of the ForesightManager.
   */
  public static get instance() {
    if (!ForesightManager.manager) {
      return this.initialize() // Initializes with defaults if not already done
    }
    return ForesightManager.manager
  }

  private checkTrajectoryHitExpiration(): void {
    const now = performance.now()
    const updatedForesightElements: ForesightElement[] = []

    this.elements.forEach((foresightElementData, element) => {
      if (
        foresightElementData.isTrajectoryHit &&
        now - foresightElementData.trajectoryHitTime > 200 // Expiration time for trajectory hit state
      ) {
        this.elements.set(element, {
          ...foresightElementData,
          isTrajectoryHit: false,
        })
        updatedForesightElements.push(element)
      }
    })

    if (updatedForesightElements.length > 0 && this.debugMode && this.debugger) {
      updatedForesightElements.forEach((element) => {
        const data = this.elements.get(element)
        if (data) {
          this.debugger!.createOrUpdateLinkOverlay(element, data)
        }
      })
    }
  }

  private normalizeHitSlop = (hitSlop: number | Rect): Rect => {
    if (typeof hitSlop === "number") {
      return {
        top: hitSlop,
        left: hitSlop,
        right: hitSlop,
        bottom: hitSlop,
      }
    }
    return hitSlop
  }

  /**
   * Registers an element with the ForesightManager.
   * @param element The HTML element to monitor.
   * @param callback The function to call upon predicted or actual interaction.
   * @param hitSlop Optional. Extra padding around the element for hit detection.
   * @param name Optional. A name for the element, used in debugging.
   * @param unregisterOnCallback Optional. If true (default), unregisters the element after its callback is triggered.
   * @returns A function to manually unregister the element.
   */
  public register(
    element: ForesightElement,
    callback: ForesightCallback,
    hitSlop?: number | Rect,
    name?: string,
    unregisterOnCallback: boolean = true // New parameter
  ): () => void {
    const normalizedHitSlop = hitSlop
      ? this.normalizeHitSlop(hitSlop)
      : (this.globalSettings.defaultHitSlop as Rect)
    const originalRect = element.getBoundingClientRect()
    const newForesightElementData: ForesightElementData = {
      callback,
      elementBounds: {
        expandedRect: this.getExpandedRect(originalRect, normalizedHitSlop),
        originalRect: originalRect,
        hitSlop: normalizedHitSlop,
      },
      isHovering: false,
      isTrajectoryHit: false,
      trajectoryHitTime: 0,
      name: name ?? "Unnamed",
      unregisterOnCallback, // Store the new option
    }
    this.elements.set(element, newForesightElementData)

    if (!this.isSetup) {
      this.setupGlobalListeners()
    }

    if (this.elementResizeObserver) {
      this.elementResizeObserver.observe(element)
    }

    if (this.debugMode && this.debugger) {
      const data = this.elements.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
      this.debugger.refreshDisplayedElements()
    }

    return () => this.unregister(element)
  }

  private unregister(element: ForesightElement): void {
    const isRegistered = this.elements.has(element)
    if (isRegistered) {
      const elementName = this.elements.get(element)?.name || "Element"
      console.log(`Unregistering element: "${elementName}"`, element)

      if (this.elementResizeObserver) {
        this.elementResizeObserver.unobserve(element)
      }

      // First, remove the element from the manager's collection
      this.elements.delete(element)

      // Then, notify the debugger to remove its visuals and refresh its list
      // based on the now-updated manager's collection.
      if (this.debugMode && this.debugger) {
        this.debugger.removeLinkOverlay(element) // Removes specific overlay and list item
        this.debugger.refreshDisplayedElements() // Rebuilds list from manager.elements
      }

      if (this.elements.size === 0 && this.isSetup) {
        this.removeGlobalListeners()
      }
    } else {
      console.log("Attempted to unregister element not found:", element)
    }
  }

  /**
   * Alters the global settings of the ForesightManager at runtime.
   */
  public alterGlobalSettings(props?: Partial<ForesightManagerProps>): void {
    let settingsActuallyChanged = false

    if (
      props?.positionHistorySize !== undefined &&
      this.globalSettings.positionHistorySize !== props.positionHistorySize
    ) {
      this.globalSettings.positionHistorySize = props.positionHistorySize
      settingsActuallyChanged = true
    }

    if (
      props?.trajectoryPredictionTime !== undefined &&
      this.globalSettings.trajectoryPredictionTime !== props.trajectoryPredictionTime
    ) {
      this.globalSettings.trajectoryPredictionTime = props.trajectoryPredictionTime
      settingsActuallyChanged = true
    }

    if (
      props?.enableMousePrediction !== undefined &&
      this.globalSettings.enableMousePrediction !== props.enableMousePrediction
    ) {
      this.globalSettings.enableMousePrediction = props.enableMousePrediction
      settingsActuallyChanged = true
      if (this.globalSettings.enableMousePrediction) {
        this.predictedPoint = this.predictMousePosition(this.currentPoint)
      } else {
        this.predictedPoint = this.currentPoint
      }
    }

    if (
      props?.defaultHitSlop !== undefined &&
      JSON.stringify(this.globalSettings.defaultHitSlop) !==
        JSON.stringify(this.normalizeHitSlop(props.defaultHitSlop))
    ) {
      this.globalSettings.defaultHitSlop = this.normalizeHitSlop(props.defaultHitSlop)
      settingsActuallyChanged = true
      this.elements.forEach((data, el) => {
        this.updateExpandedRect(el, data.elementBounds.hitSlop)
      })
    }

    if (
      props?.resizeScrollThrottleDelay !== undefined &&
      this.globalSettings.resizeScrollThrottleDelay !== props.resizeScrollThrottleDelay
    ) {
      this.globalSettings.resizeScrollThrottleDelay = props.resizeScrollThrottleDelay
      settingsActuallyChanged = true
    }

    if (props?.debug !== undefined && this.globalSettings.debug !== props.debug) {
      this.globalSettings.debug = props.debug
      settingsActuallyChanged = true
      if (this.globalSettings.debug) {
        this.turnOnDebugMode()
      } else {
        if (this.debugger) {
          this.debugger.cleanup()
          this.debugger = null
        }
      }
      this.debugMode = this.globalSettings.debug
    }

    if (settingsActuallyChanged && this.globalSettings.debug && this.debugger) {
      this.debugger.updateControlsState(this.globalSettings)
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
      this.elements.forEach((data, el) => {
        this.debugger!.createOrUpdateLinkOverlay(el, data)
      })
      this.debugger.refreshDisplayedElements()
    }
  }

  private turnOnDebugMode() {
    this.debugMode = true
    if (!this.debugger) {
      this.debugger = new ForesightDebugger(this)
      this.debugger.initialize(
        this.elements,
        this.globalSettings,
        this.currentPoint,
        this.predictedPoint
      )
    } else {
      this.debugger.updateControlsState(this.globalSettings)
      this.debugger.updateAllLinkVisuals(this.elements) // This will refresh the element list too
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
    }
  }

  private getExpandedRect(baseRect: Rect | DOMRect, hitSlop: Rect): Rect {
    return {
      left: baseRect.left - hitSlop.left,
      right: baseRect.right + hitSlop.right,
      top: baseRect.top - hitSlop.top,
      bottom: baseRect.bottom + hitSlop.bottom,
    }
  }

  private updateExpandedRect(element: ForesightElement, hitSlop: Rect): void {
    const foresightElementData = this.elements.get(element)
    if (!foresightElementData) return

    const newOriginalRect = element.getBoundingClientRect()
    const currentHitSlop = foresightElementData.elementBounds.hitSlop
    const expandedRect = this.getExpandedRect(newOriginalRect, currentHitSlop)

    if (
      JSON.stringify(expandedRect) !==
        JSON.stringify(foresightElementData.elementBounds.expandedRect) ||
      JSON.stringify(newOriginalRect) !==
        JSON.stringify(foresightElementData.elementBounds.originalRect)
    ) {
      this.elements.set(element, {
        ...foresightElementData,
        elementBounds: {
          ...foresightElementData.elementBounds,
          originalRect: newOriginalRect,
          expandedRect,
        },
      })

      if (this.debugMode && this.debugger) {
        const updatedData = this.elements.get(element)
        if (updatedData) this.debugger.createOrUpdateLinkOverlay(element, updatedData)
      }
    }
  }

  private updateAllRects(): void {
    this.elements.forEach((data, element) => {
      this.updateExpandedRect(element, data.elementBounds.hitSlop)
    })
  }

  private predictMousePosition = (point: Point): Point => {
    const now = performance.now()
    const currentPosition: MousePosition = { point, time: now }
    const { x, y } = point

    this.positions.push(currentPosition)
    if (this.positions.length > this.globalSettings.positionHistorySize) {
      this.positions.shift()
    }

    if (this.positions.length < 2) {
      return { x, y }
    }

    const first = this.positions[0]
    const last = this.positions[this.positions.length - 1]
    const dt = (last.time - first.time) / 1000

    if (dt === 0) {
      return { x, y }
    }

    const dx = last.point.x - first.point.x
    const dy = last.point.y - first.point.y
    const vx = dx / dt
    const vy = dy / dt

    const trajectoryPredictionTimeInSeconds = this.globalSettings.trajectoryPredictionTime / 1000
    const predictedX = x + vx * trajectoryPredictionTimeInSeconds
    const predictedY = y + vy * trajectoryPredictionTimeInSeconds
    return { x: predictedX, y: predictedY }
  }

  private lineSegmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
    let t0 = 0.0
    let t1 = 1.0
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y

    const clipTest = (p: number, q: number): boolean => {
      if (p === 0) {
        if (q < 0) return false
      } else {
        const r = q / p
        if (p < 0) {
          if (r > t1) return false
          if (r > t0) t0 = r
        } else {
          if (r < t0) return false
          if (r < t1) t1 = r
        }
      }
      return true
    }

    if (!clipTest(-dx, p1.x - rect.left)) return false
    if (!clipTest(dx, rect.right - p1.x)) return false
    if (!clipTest(-dy, p1.y - rect.top)) return false
    if (!clipTest(dy, rect.bottom - p1.y)) return false

    return t0 <= t1
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.currentPoint = { x: e.clientX, y: e.clientY }
    this.predictedPoint = this.globalSettings.enableMousePrediction
      ? this.predictMousePosition(this.currentPoint)
      : this.currentPoint

    let elementsToUpdateInDebugger: ForesightElement[] | null = null
    if (this.debugMode && this.debugger) {
      elementsToUpdateInDebugger = []
    }

    const elementsToUnregister: ForesightElement[] = [] // Collect elements to unregister

    this.elements.forEach((currentData, element) => {
      // If element was already unregistered in a previous iteration of this same mousemove
      // (e.g. if multiple elements are hit and unregistered), skip it.
      if (!this.elements.has(element)) {
        return
      }

      const previousDataState = {
        isHovering: currentData.isHovering,
        isTrajectoryHit: currentData.isTrajectoryHit,
        trajectoryHitTime: currentData.trajectoryHitTime,
      }

      let callbackFiredThisCycle = false
      let finalIsHovering = currentData.isHovering
      let finalIsTrajectoryHit = currentData.isTrajectoryHit
      let finalTrajectoryHitTime = currentData.trajectoryHitTime

      const { expandedRect } = currentData.elementBounds

      const isCurrentlyPhysicallyHovering =
        this.currentPoint.x >= expandedRect.left &&
        this.currentPoint.x <= expandedRect.right &&
        this.currentPoint.y >= expandedRect.top &&
        this.currentPoint.y <= expandedRect.bottom

      let isNewTrajectoryActivation = false
      if (
        this.globalSettings.enableMousePrediction &&
        !isCurrentlyPhysicallyHovering &&
        !currentData.isTrajectoryHit
      ) {
        if (this.lineSegmentIntersectsRect(this.currentPoint, this.predictedPoint, expandedRect)) {
          isNewTrajectoryActivation = true
        }
      }

      if (isNewTrajectoryActivation) {
        currentData.callback()
        callbackFiredThisCycle = true
        finalIsTrajectoryHit = true
        finalTrajectoryHitTime = performance.now()
      }

      const isNewPhysicalHoverEvent = isCurrentlyPhysicallyHovering && !currentData.isHovering

      if (isNewPhysicalHoverEvent) {
        const hoverCanTriggerCallback =
          !currentData.isTrajectoryHit ||
          (currentData.isTrajectoryHit && !this.globalSettings.enableMousePrediction)

        if (!callbackFiredThisCycle && hoverCanTriggerCallback) {
          currentData.callback()
          callbackFiredThisCycle = true // Mark callback as fired for physical hover too
        }
      }

      finalIsHovering = isCurrentlyPhysicallyHovering

      // If callback fired and element is set to unregister on callback
      if (callbackFiredThisCycle && currentData.unregisterOnCallback) {
        elementsToUnregister.push(element) // Mark for unregistration
      }

      const coreStateActuallyChanged =
        finalIsHovering !== previousDataState.isHovering ||
        finalIsTrajectoryHit !== previousDataState.isTrajectoryHit ||
        (finalIsTrajectoryHit && finalTrajectoryHitTime !== previousDataState.trajectoryHitTime)

      if (coreStateActuallyChanged && this.elements.has(element)) {
        // Check .has(element) again in case it was unregistered by a previous element's callback in the same event cycle
        const newElementData: ForesightElementData = {
          ...currentData,
          isHovering: finalIsHovering,
          isTrajectoryHit: finalIsTrajectoryHit,
          trajectoryHitTime: finalTrajectoryHitTime,
        }
        this.elements.set(element, newElementData)

        if (elementsToUpdateInDebugger) {
          elementsToUpdateInDebugger.push(element)
        }
      }
    })

    // Unregister elements marked for unregistration
    if (elementsToUnregister.length > 0) {
      elementsToUnregister.forEach((element) => {
        if (this.elements.has(element)) {
          // Check if still registered
          const elementName = this.elements.get(element)?.name || "Unnamed"
          console.log(
            `Unregistering element "${elementName}" due to callback and unregisterOnCallback=true.`
          )
          this.unregister(element)
        }
      })
      // After unregistering, if debugger is active, it might need a final refresh
      // if elementsToUpdateInDebugger contained any of the now-unregistered elements.
      // The unregister method itself calls refreshDisplayedElements, which should handle the list.
      // We just need to ensure elementsToUpdateInDebugger doesn't try to update a removed element.
    }

    if (this.debugMode && this.debugger) {
      // Check debugMode and debugger existence
      elementsToUpdateInDebugger?.forEach((element) => {
        // Optional chaining for elementsToUpdateInDebugger
        const data = this.elements.get(element)
        if (data) {
          this.debugger!.createOrUpdateLinkOverlay(element, data)
        }
      })
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
    }
  }

  private handleResizeOrScroll = (): void => {
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
    }

    const now = performance.now()
    const timeSinceLastCall = now - this.lastResizeScrollCallTimestamp
    const currentDelay = this.globalSettings.resizeScrollThrottleDelay

    if (timeSinceLastCall >= currentDelay) {
      this.updateAllRects()
      this.lastResizeScrollCallTimestamp = now
      this.resizeScrollThrottleTimeoutId = null
    } else {
      this.resizeScrollThrottleTimeoutId = setTimeout(() => {
        this.updateAllRects()
        this.lastResizeScrollCallTimestamp = performance.now()
        this.resizeScrollThrottleTimeoutId = null
      }, currentDelay - timeSinceLastCall)
    }
  }

  private handleElementResize = (entries: ResizeObserverEntry[]): void => {
    for (const entry of entries) {
      const element = entry.target as ForesightElement
      const foresightElementData = this.elements.get(element)

      if (foresightElementData) {
        this.updateExpandedRect(element, foresightElementData.elementBounds.hitSlop)
      }
    }
  }

  private handleDomMutations = (mutationsList: MutationRecord[]): void => {
    let structuralChangeDetected = false
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        const currentElements = Array.from(this.elements.keys())
        for (const element of currentElements) {
          if (!element.isConnected) {
            if (this.elements.has(element)) {
              this.unregister(element)
            }
          }
        }
      }
      if (
        mutation.type === "childList" ||
        (mutation.type === "attributes" &&
          (mutation.attributeName === "style" || mutation.attributeName === "class"))
      ) {
        structuralChangeDetected = true
      }
    }

    if (structuralChangeDetected && this.elements.size > 0) {
      if (this.domMutationRectsUpdateTimeoutId) {
        clearTimeout(this.domMutationRectsUpdateTimeoutId)
      }
      const now = performance.now()
      const delay = this.globalSettings.resizeScrollThrottleDelay
      const timeSinceLastCall = now - this.lastDomMutationRectsUpdateTimestamp

      if (timeSinceLastCall >= delay) {
        console.log("DOM Mutation: Updating all rects immediately")
        this.updateAllRects()
        this.lastDomMutationRectsUpdateTimestamp = now
        this.domMutationRectsUpdateTimeoutId = null
      } else {
        this.domMutationRectsUpdateTimeoutId = setTimeout(() => {
          console.log("DOM Mutation: Updating all rects after throttle delay")
          this.updateAllRects()
          this.lastDomMutationRectsUpdateTimestamp = performance.now()
          this.domMutationRectsUpdateTimeoutId = null
        }, delay - timeSinceLastCall)
      }
    }
  }

  private setupGlobalListeners(): void {
    console.log("Setting up global listeners")
    if (this.isSetup) return
    document.addEventListener("mousemove", this.handleMouseMove)
    window.addEventListener("resize", this.handleResizeOrScroll)
    window.addEventListener("scroll", this.handleResizeOrScroll)

    if (!this.domObserver) {
      this.domObserver = new MutationObserver(this.handleDomMutations)
    }
    this.domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    if (!this.elementResizeObserver) {
      this.elementResizeObserver = new ResizeObserver(this.handleElementResize)
      this.elements.forEach((_, element) => this.elementResizeObserver!.observe(element))
    }
    this.isSetup = true
  }

  private removeGlobalListeners(): void {
    document.removeEventListener("mousemove", this.handleMouseMove)
    window.removeEventListener("resize", this.handleResizeOrScroll)
    window.removeEventListener("scroll", this.handleResizeOrScroll)

    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
      this.resizeScrollThrottleTimeoutId = null
    }
    if (this.domMutationRectsUpdateTimeoutId) {
      clearTimeout(this.domMutationRectsUpdateTimeoutId)
      this.domMutationRectsUpdateTimeoutId = null
    }

    if (this.domObserver) {
      this.domObserver.disconnect()
    }
    if (this.elementResizeObserver) {
      this.elementResizeObserver.disconnect()
    }
    this.isSetup = false
  }
}
