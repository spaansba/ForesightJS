import { ForesightDebugger } from "../Debugger/ForesightDebugger"
import type {
  ForesightCallback,
  ForesightManagerProps,
  ForesightElementData,
  ForesightElement,
  MousePosition,
  Point,
  Rect,
  UpdateForsightManagerProps, // Assuming this is Partial<ForesightManagerProps>
} from "../../types/types"

/**
 * Manages the prediction of user intent based on mouse trajectory and element interactions.
 * // ... (rest of the class comments)
 */
export class ForesightManager {
  private static manager: ForesightManager
  public elements: Map<ForesightElement, ForesightElementData> = new Map()

  private isSetup: boolean = false
  private debugger: ForesightDebugger | null = null

  private globalSettings: ForesightManagerProps = {
    debug: false,
    enableMousePrediction: true,
    positionHistorySize: 8,
    trajectoryPredictionTime: 80,
    defaultHitSlop: { top: 0, left: 0, right: 0, bottom: 0 }, // Initialized as Rect
    resizeScrollThrottleDelay: 50,
  }

  private positions: MousePosition[] = []
  private currentPoint: Point = { x: 0, y: 0 }
  private predictedPoint: Point = { x: 0, y: 0 }

  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null

  private domObserver: MutationObserver | null = null
  private lastDomMutationRectsUpdateTimestamp: number = 0
  private domMutationRectsUpdateTimeoutId: ReturnType<typeof setTimeout> | null = null

  private elementResizeObserver: ResizeObserver | null = null

  private constructor() {
    // REMOVED: setInterval(this.checkTrajectoryHitExpiration.bind(this), 100)
    // defaultHitSlop is already normalized at declaration or can be normalized if needed
    // this.globalSettings.defaultHitSlop = this.normalizeHitSlop(this.globalSettings.defaultHitSlop);
  }

  public static initialize(props?: Partial<UpdateForsightManagerProps>): ForesightManager {
    if (!ForesightManager.manager) {
      ForesightManager.manager = new ForesightManager()
      if (props) {
        ForesightManager.manager.alterGlobalSettings(props)
      } else {
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
    return ForesightManager.manager
  }

  public static get instance() {
    if (!ForesightManager.manager) {
      return this.initialize()
    }
    return ForesightManager.manager
  }

  // REMOVED: private checkTrajectoryHitExpiration(): void { ... }

  public register(
    element: ForesightElement,
    callback: ForesightCallback,
    hitSlop?: number | Rect,
    name?: string,
    unregisterOnCallback: boolean = true
  ): () => void {
    const normalizedHitSlop = hitSlop
      ? this.normalizeHitSlop(hitSlop)
      : this.globalSettings.defaultHitSlop // Already a Rect
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
      unregisterOnCallback,
      trajectoryHitExpirationTimeoutId: undefined, // Initialize
    }
    this.elements.set(element, newForesightElementData)

    if (!this.isSetup) {
      this.setupGlobalListeners()
    }

    if (this.elementResizeObserver) {
      this.elementResizeObserver.observe(element)
    }

    if (this.debugger) {
      const data = this.elements.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
      this.debugger.refreshDisplayedElements()
    }

    return () => this.unregister(element)
  }

  private unregister(element: ForesightElement) {
    const isRegistered = this.elements.has(element)
    if (isRegistered) {
      const foresightElementData = this.elements.get(element)
      const elementName = foresightElementData?.name || "Element"
      console.log(`Unregistering element: "${elementName}"`, element)

      // Clear any pending trajectory expiration timeout
      if (foresightElementData?.trajectoryHitExpirationTimeoutId) {
        clearTimeout(foresightElementData.trajectoryHitExpirationTimeoutId)
      }

      if (this.elementResizeObserver) {
        this.elementResizeObserver.unobserve(element)
      }

      this.elements.delete(element)

      if (this.debugger) {
        this.debugger.removeLinkOverlay(element)
        this.debugger.refreshDisplayedElements()
      }

      if (this.elements.size === 0 && this.isSetup) {
        this.removeGlobalListeners()
      }
    } else {
      console.log("Attempted to unregister element not found:", element)
    }
  }

  public alterGlobalSettings(props?: Partial<UpdateForsightManagerProps>): void {
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
        // When disabling prediction, clear active trajectory hits and their timeouts
        this.elements.forEach((data, el) => {
          if (data.isTrajectoryHit) {
            if (data.trajectoryHitExpirationTimeoutId) {
              clearTimeout(data.trajectoryHitExpirationTimeoutId)
            }
            const updatedElementData: ForesightElementData = {
              ...data,
              isTrajectoryHit: false,
              trajectoryHitTime: 0,
              trajectoryHitExpirationTimeoutId: undefined,
            }
            this.elements.set(el, updatedElementData)
            if (this.debugger) {
              this.debugger.createOrUpdateLinkOverlay(el, updatedElementData)
            }
          }
        })
      }
    }

    if (props?.defaultHitSlop !== undefined) {
      const normalizedNewHitSlop = this.normalizeHitSlop(props.defaultHitSlop)
      if (!this.areRectsEqual(this.globalSettings.defaultHitSlop, normalizedNewHitSlop)) {
        this.globalSettings.defaultHitSlop = normalizedNewHitSlop
        settingsActuallyChanged = true
        // This recomputes expandedRects using each element's own stored hitSlop.
        // If an element's hitSlop itself needs to change because it was using the
        // old default, that logic would need to be more explicit here.
        // For now, this just updates the global default for future use and forces re-calc.
        this.elements.forEach((data, element) => {
          this.updateExpandedRect(element)
        })
      }
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
      this.debugger.updateAllLinkVisuals(this.elements)
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMousePrediction
      )
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

  private getExpandedRect(baseRect: Rect | DOMRect, hitSlop: Rect): Rect {
    return {
      left: baseRect.left - hitSlop.left,
      right: baseRect.right + hitSlop.right,
      top: baseRect.top - hitSlop.top,
      bottom: baseRect.bottom + hitSlop.bottom,
    }
  }

  private areRectsEqual(rect1: Rect, rect2: Rect): boolean {
    if (!rect1 || !rect2) return rect1 === rect2
    return (
      rect1.left === rect2.left &&
      rect1.right === rect2.right &&
      rect1.top === rect2.top &&
      rect1.bottom === rect2.bottom
    )
  }
  private updateExpandedRect(element: ForesightElement) {
    const foresightElementData = this.elements.get(element)
    if (!foresightElementData) return

    const newOriginalRect = element.getBoundingClientRect()
    const currentHitSlop = foresightElementData.elementBounds.hitSlop
    const expandedRect = this.getExpandedRect(newOriginalRect, currentHitSlop)

    if (
      !this.areRectsEqual(expandedRect, foresightElementData.elementBounds.expandedRect) ||
      !this.areRectsEqual(newOriginalRect, foresightElementData.elementBounds.originalRect)
    ) {
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

  private updateAllRects() {
    this.elements.forEach((data, element) => {
      this.updateExpandedRect(element)
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
    // (Liang-Barsky algorithm implementation)
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

  private handleMouseMove = (e: MouseEvent) => {
    this.currentPoint = { x: e.clientX, y: e.clientY }
    this.predictedPoint = this.globalSettings.enableMousePrediction
      ? this.predictMousePosition(this.currentPoint)
      : this.currentPoint

    let elementsToUpdateInDebugger: ForesightElement[] | null = null
    if (this.debugger) {
      elementsToUpdateInDebugger = []
    }

    const elementsToUnregister: ForesightElement[] = []

    this.elements.forEach((currentData, element) => {
      if (!this.elements.has(element)) {
        return
      }

      const previousDataState = {
        isHovering: currentData.isHovering,
        isTrajectoryHit: currentData.isTrajectoryHit,
        trajectoryHitTime: currentData.trajectoryHitTime,
        trajectoryHitExpirationTimeoutId: currentData.trajectoryHitExpirationTimeoutId,
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
        !currentData.isTrajectoryHit // Only activate if not already hit
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
          !currentData.isTrajectoryHit || // If not trajectory hit, hover can trigger
          (currentData.isTrajectoryHit && !this.globalSettings.enableMousePrediction) // Or if trajectory was hit but prediction is now off

        if (!callbackFiredThisCycle && hoverCanTriggerCallback) {
          currentData.callback()
          callbackFiredThisCycle = true
        }
      }

      finalIsHovering = isCurrentlyPhysicallyHovering

      // If physically hovering, it overrides any "trajectory hit" state for expiration purposes
      // but the visual/logical state of isTrajectoryHit might persist if it happened first.
      // The main change is how the expiration timeout is handled.

      if (callbackFiredThisCycle && currentData.unregisterOnCallback) {
        elementsToUnregister.push(element)
      }

      const coreStateActuallyChanged =
        finalIsHovering !== previousDataState.isHovering ||
        finalIsTrajectoryHit !== previousDataState.isTrajectoryHit ||
        (finalIsTrajectoryHit && finalTrajectoryHitTime !== previousDataState.trajectoryHitTime)

      if (coreStateActuallyChanged && this.elements.has(element)) {
        let newElementData: ForesightElementData = {
          ...currentData,
          isHovering: finalIsHovering,
          isTrajectoryHit: finalIsTrajectoryHit,
          trajectoryHitTime: finalTrajectoryHitTime,
          trajectoryHitExpirationTimeoutId: previousDataState.trajectoryHitExpirationTimeoutId, // Preserve existing initially
        }

        // Manage trajectory hit expiration timeout
        if (newElementData.isTrajectoryHit && !previousDataState.isTrajectoryHit) {
          // Just became a trajectory hit (or re-hit after expiration)
          if (newElementData.trajectoryHitExpirationTimeoutId) {
            clearTimeout(newElementData.trajectoryHitExpirationTimeoutId)
          }
          newElementData.trajectoryHitExpirationTimeoutId = setTimeout(() => {
            const currentElementData = this.elements.get(element)
            if (
              currentElementData &&
              currentElementData.isTrajectoryHit &&
              currentElementData.trajectoryHitTime === newElementData.trajectoryHitTime // Ensure it's the same hit instance
            ) {
              const expiredData: ForesightElementData = {
                ...currentElementData,
                isTrajectoryHit: false,
                trajectoryHitExpirationTimeoutId: undefined,
              }
              this.elements.set(element, expiredData)
              if (this.debugger) {
                this.debugger.createOrUpdateLinkOverlay(element, expiredData)
              }
            }
          }, 200)
        } else if (!newElementData.isTrajectoryHit && previousDataState.isTrajectoryHit) {
          // No longer a trajectory hit (e.g. mouse moved away, physical hover, or prediction disabled)
          if (newElementData.trajectoryHitExpirationTimeoutId) {
            clearTimeout(newElementData.trajectoryHitExpirationTimeoutId)
            newElementData.trajectoryHitExpirationTimeoutId = undefined
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

    if (elementsToUnregister.length > 0) {
      elementsToUnregister.forEach((element) => {
        if (this.elements.has(element)) {
          const elementName = this.elements.get(element)?.name || "Unnamed"
          console.log(
            `Unregistering element "${elementName}" due to callback and unregisterOnCallback=true.`
          )
          this.unregister(element) // unregister will clear its own timeout
        }
      })
    }

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

  private handleElementResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const element = entry.target as ForesightElement
      const foresightElementData = this.elements.get(element)

      if (foresightElementData) {
        this.updateExpandedRect(element)
      }
    }
  }

  private handleDomMutations = (mutationsList: MutationRecord[]) => {
    let structuralChangeDetected = false
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
        this.updateAllRects()
        this.lastDomMutationRectsUpdateTimestamp = now
        this.domMutationRectsUpdateTimeoutId = null
      } else {
        this.domMutationRectsUpdateTimeoutId = setTimeout(() => {
          this.updateAllRects()
          this.lastDomMutationRectsUpdateTimestamp = performance.now()
          this.domMutationRectsUpdateTimeoutId = null
        }, delay - timeSinceLastCall)
      }
    }
  }

  private setupGlobalListeners() {
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

  private removeGlobalListeners() {
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
