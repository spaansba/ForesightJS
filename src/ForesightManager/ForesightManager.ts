import { ForesightDebugger } from "./ForesightDebugger"
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
 * - Handling global settings for prediction behavior (e.g., history size, prediction time).
 * - Optionally enabling a {@link ForesightDebugger} for visual feedback.
 *
 * It should be initialized once using {@link ForesightManager.initialize} and then
 * accessed via the static getter {@link ForesightManager.instance}.
 */
export class ForesightManager {
  private static manager: ForesightManager
  private elements: Map<ForesightElement, ForesightElementData> = new Map()

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

  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null

  private constructor() {
    this.globalSettings.defaultHitSlop = this.normalizeHitSlop(this.globalSettings.defaultHitSlop)
    setInterval(this.checkTrajectoryHitExpiration.bind(this), 100)
  }

  /**
   * Initializes the ForesightManager singleton instance with optional global settings.
   *
   * This method sets up the manager, applying any provided configuration. If the manager
   * is already initialized and this method is called again with new props, it will
   * log an error and apply the new settings using `alterGlobalSettings`.
   * It's recommended to call this method only once at the application's entry point.
   *
   * If `props.debug` is true or becomes true, the {@link ForesightDebugger} will be initialized or updated.
   *
   * @param {Partial<ForesightManagerProps>} [props] - Optional initial global settings
   *        to configure the manager. See {@link ForesightManagerProps} for details.
   * @returns {ForesightManager} The singleton instance of the ForesightManager.
   */
  public static initialize(props?: Partial<ForesightManagerProps>): ForesightManager {
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
    ForesightManager.manager.debugMode = ForesightManager.manager.globalSettings.debug
    return ForesightManager.manager
  }

  /**
   * Gets the singleton instance of the ForesightManager.
   *
   * If the manager has not been initialized yet, this getter will call
   * {@link ForesightManager.initialize} with default settings to create the instance.
   *
   * @returns {ForesightManager} The singleton instance of the ForesightManager.
   */
  public static get instance() {
    if (!ForesightManager.manager) {
      return this.initialize()
    }
    return ForesightManager.manager
  }

  private checkTrajectoryHitExpiration(): void {
    const now = performance.now()
    let needsVisualUpdate = false
    const updatedForesightElements: ForesightElement[] = []

    this.elements.forEach((foresightElementData, element) => {
      if (
        foresightElementData.isTrajectoryHit &&
        now - foresightElementData.trajectoryHitTime > 100
      ) {
        this.elements.set(element, {
          ...foresightElementData,
          isTrajectoryHit: false,
        })
        needsVisualUpdate = true
        updatedForesightElements.push(element)
      }
    })

    if (needsVisualUpdate && this.debugMode && this.debugger) {
      updatedForesightElements.forEach((element) => {
        const data = this.elements.get(element)
        if (data && this.debugger) {
          this.debugger.createOrUpdateLinkOverlay(element, data)
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
   * Registers an element with the ForesightManager to monitor for predicted interactions.
   *
   * @param element The HTML element to monitor.
   * @param callback The function to execute when an interaction is predicted or occurs.
   *                 (Corresponds to {@link ForesightElementConfig.callback})
   * @param hitSlop Optional. The amount of "slop" to add to the element's bounding box
   *                for hit detection. Can be a single number or a Rect object.
   *                This will overwrite the default global hitSlop set by the initializer of foresight.
   * @param name Optional. A descriptive name for the element, useful for debugging.
   *             Defaults to "Unnamed".
   * @returns A function to unregister the element.
   */
  public register(
    element: ForesightElement,
    callback: ForesightCallback,
    hitSlop?: number | Rect,
    name?: string
  ): () => void {
    const normalizedHitSlop = hitSlop
      ? this.normalizeHitSlop(hitSlop)
      : (this.globalSettings.defaultHitSlop as Rect) // Already normalized in constructor
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
    }
    this.elements.set(element, newForesightElementData)
    this.setupGlobalListeners()
    if (this.debugMode && this.debugger) {
      const data = this.elements.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
    }

    return () => this.unregister(element)
  }

  private unregister(element: ForesightElement): void {
    console.log("Unregistering element:", element)
    this.elements.delete(element)
    if (this.debugMode && this.debugger) {
      this.debugger.removeLinkOverlay(element)
    }
    if (this.elements.size === 0 && this.isSetup) {
      this.removeGlobalListeners()
    }
  }

  /**
   * Alters the global settings of the ForesightManager at runtime.
   *
   * This method allows dynamic updates to global configuration properties such as
   * prediction parameters (`positionHistorySize`, `trajectoryPredictionTime`),
   * `defaultHitSlop`, `debug` mode, and more.
   *
   * While global settings are typically best configured once via
   * {@link ForesightManager.initialize} at the application's start, this method
   * provides a way to modify them post-initialization. It is notably used by the
   * {@link ForesightDebugger} UI to allow real-time adjustments for testing and
   * tuning prediction behavior.
   *
   * For element-specific configurations (like an individual element's `hitSlop` or `name`),
   * those should be provided during the element's registration via the
   * {@link ForesightManager.register} method.
   *
   * If debug mode is active (`globalSettings.debug` is true) and any settings
   * that affect the debugger's display or controls are changed, the
   * {@link ForesightDebugger} instance will be updated accordingly.
   *
   * @param {Partial<ForesightManagerProps>} [props] - An object containing the global
   *        settings to update. Only properties provided in this object will be changed.
   *        See {@link ForesightManagerProps} for available settings.
   */
  public alterGlobalSettings(props?: Partial<ForesightManagerProps>): void {
    let settingsActuallyChanged = false

    // ... (other settings like positionHistorySize, trajectoryPredictionTime) ...

    if (
      props?.enableMousePrediction !== undefined &&
      this.globalSettings.enableMousePrediction !== props.enableMousePrediction
    ) {
      this.globalSettings.enableMousePrediction = props.enableMousePrediction
      settingsActuallyChanged = true
      // === ADD THIS BLOCK START ===
      // If the prediction setting changed, immediately update the predictedPoint
      if (this.globalSettings.enableMousePrediction) {
        // Recalculate prediction if it's now enabled
        this.predictedPoint = this.predictMousePosition(this.currentPoint)
      } else {
        // If prediction is disabled, predicted point is the current point
        this.predictedPoint = this.currentPoint
      }
      // === ADD THIS BLOCK END ===
    }

    // ... (other settings like defaultHitSlop, resizeScrollThrottleDelay, debug) ...
    if (props?.debug !== undefined && this.globalSettings.debug !== props.debug) {
      this.globalSettings.debug = props.debug
      // No need to set settingsActuallyChanged here for debug toggle itself,
      // as turnOnDebugMode/cleanup handles visuals.
      // But if other settings changed AND debug is on, the visual update below is needed.
      if (this.globalSettings.debug) {
        this.turnOnDebugMode() // This will initialize or update debugger
      } else {
        if (this.debugger) {
          this.debugger.cleanup()
          this.debugger = null
        }
      }
      this.debugMode = this.globalSettings.debug
      // If only debug status changed, we might not need the full visual update below,
      // as turnOnDebugMode handles its own initialization.
      // However, if other settings changed concurrently, we do.
    }

    if (settingsActuallyChanged && this.globalSettings.debug && this.debugger) {
      this.debugger.updateControlsState(this.globalSettings)
      // Now this.predictedPoint is fresh based on the new enableMousePrediction state
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint, // This will now be the re-calculated point
        this.globalSettings.enableMousePrediction
      )
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

    const expandedRect = this.getExpandedRect(element.getBoundingClientRect(), hitSlop)

    if (
      JSON.stringify(expandedRect) !==
      JSON.stringify(foresightElementData.elementBounds.expandedRect)
    ) {
      this.elements.set(element, {
        ...foresightElementData,
        elementBounds: {
          ...foresightElementData.elementBounds,
          expandedRect,
        },
      })
    }

    if (this.debugMode && this.debugger) {
      const updatedData = this.elements.get(element)
      if (updatedData) this.debugger.createOrUpdateLinkOverlay(element, updatedData)
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

  /**
   * Checks if a line segment intersects with an axis-aligned rectangle.
   * Uses the Liang-Barsky line clipping algorithm.
   * @param p1 Start point of the line segment.
   * @param p2 End point of the line segment.
   * @param rect The rectangle to check against.
   * @returns True if the line segment intersects the rectangle, false otherwise.
   */
  private lineSegmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
    let t0 = 0.0
    let t1 = 1.0
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y

    // Helper function for Liang-Barsky algorithm
    // p: parameter related to edge normal and line direction
    // q: parameter related to distance from p1 to edge
    const clipTest = (p: number, q: number): boolean => {
      if (p === 0) {
        // Line is parallel to the clip edge
        if (q < 0) {
          // Line is outside the clip edge (p1 is on the "wrong" side)
          return false
        }
      } else {
        const r = q / p
        if (p < 0) {
          // Line proceeds from outside to inside (potential entry)
          if (r > t1) return false // Enters after already exited
          if (r > t0) t0 = r // Update latest entry time
        } else {
          // Line proceeds from inside to outside (potential exit) (p > 0)
          if (r < t0) return false // Exits before already entered
          if (r < t1) t1 = r // Update earliest exit time
        }
      }
      return true
    }

    // Left edge: rect.left
    if (!clipTest(-dx, p1.x - rect.left)) return false
    // Right edge: rect.right
    if (!clipTest(dx, rect.right - p1.x)) return false
    // Top edge: rect.top
    if (!clipTest(-dy, p1.y - rect.top)) return false
    // Bottom edge: rect.bottom
    if (!clipTest(dy, rect.bottom - p1.y)) return false

    // If t0 > t1, the segment is completely outside or misses the clip window.
    // Also, the valid intersection must be within the segment [0,1].
    // Since t0 and t1 are initialized to 0 and 1, and clamped,
    // this also ensures the intersection lies on the segment.
    return t0 <= t1
  }

  private isMouseInExpandedArea = (
    area: Rect,
    clientPoint: Point,
    isAlreadyHovering: boolean
  ): { isHoveringInArea: boolean; shouldRunCallback: boolean } => {
    const isInExpandedArea =
      clientPoint.x >= area.left &&
      clientPoint.x <= area.right &&
      clientPoint.y >= area.top &&
      clientPoint.y <= area.bottom
    if (isInExpandedArea && !isAlreadyHovering) {
      return { isHoveringInArea: true, shouldRunCallback: true }
    }
    return { isHoveringInArea: isInExpandedArea, shouldRunCallback: false }
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.currentPoint = { x: e.clientX, y: e.clientY }
    this.predictedPoint = this.globalSettings.enableMousePrediction
      ? this.predictMousePosition(this.currentPoint)
      : this.currentPoint

    const elementsToUpdateInDebugger: ForesightElement[] = []

    this.elements.forEach((foresightElementData, element) => {
      if (!foresightElementData.elementBounds.expandedRect) return

      const { isHoveringInArea, shouldRunCallback } = this.isMouseInExpandedArea(
        foresightElementData.elementBounds.expandedRect,
        this.currentPoint,
        foresightElementData.isHovering
      )

      let elementStateChanged = false

      if (this.globalSettings.enableMousePrediction && !isHoveringInArea) {
        // Check if the trajectory line segment intersects the expanded rect
        if (
          this.lineSegmentIntersectsRect(
            this.currentPoint,
            this.predictedPoint,
            foresightElementData.elementBounds.expandedRect
          )
        ) {
          if (!foresightElementData.isTrajectoryHit) {
            foresightElementData.callback()
            this.elements.set(element, {
              ...foresightElementData,
              isTrajectoryHit: true,
              trajectoryHitTime: performance.now(),
              isHovering: isHoveringInArea, // isHoveringInArea is false here
            })
            elementStateChanged = true
          }
        }
        // Note: No 'else' here to turn off isTrajectoryHit immediately.
        // It's managed by checkTrajectoryHitExpiration or when actual hover occurs.
      }

      if (foresightElementData.isHovering !== isHoveringInArea) {
        this.elements.set(element, {
          ...foresightElementData,
          isHovering: isHoveringInArea,
          // Preserve trajectory hit state if it was already hit,
          // unless actual hover is now false and trajectory also doesn't hit
          // (though trajectory hit is primarily for non-hovering states)
          isTrajectoryHit: this.elements.get(element)!.isTrajectoryHit,
          trajectoryHitTime: this.elements.get(element)!.trajectoryHitTime,
        })
        elementStateChanged = true
      }

      if (elementStateChanged) {
        elementsToUpdateInDebugger.push(element)
      }

      if (shouldRunCallback) {
        if (
          !foresightElementData.isTrajectoryHit ||
          (foresightElementData.isTrajectoryHit && !this.globalSettings.enableMousePrediction)
        ) {
          foresightElementData.callback()
        }
      }
    })

    if (this.debugMode && this.debugger) {
      elementsToUpdateInDebugger.forEach((element) => {
        const data = this.elements.get(element)
        if (data) this.debugger!.createOrUpdateLinkOverlay(element, data)
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

  private setupGlobalListeners(): void {
    if (this.isSetup) return
    document.addEventListener("mousemove", this.handleMouseMove)
    window.addEventListener("resize", this.handleResizeOrScroll)
    window.addEventListener("scroll", this.handleResizeOrScroll)
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
    this.isSetup = false
  }
}
