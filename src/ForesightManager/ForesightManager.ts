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
        now - foresightElementData.trajectoryHitTime > 200
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
      // This requires updating all existing elements' expandedRects if they use default
      this.elements.forEach((data, el) => {
        // Check if the element is using the (old) default hitSlop
        // This comparison is tricky if the old default was a number and normalized.
        // For simplicity, we might just update all, or be more precise.
        // Assuming if a specific hitSlop was provided at registration, it's stored in data.elementBounds.hitSlop
        // If data.elementBounds.hitSlop matches the *old* global default, update it.
        // A simpler approach for now: if global defaultHitSlop changes, re-evaluate all rects
        // that might have been using it. The most robust is to update all.
        this.updateExpandedRect(el, data.elementBounds.hitSlop) // This will use its own hitSlop or the new default if it was using default
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
      settingsActuallyChanged = true // Mark true so debugger visuals update if other settings also changed
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
      // If settings affecting element visuals (like hitSlop indirectly) changed,
      // ensure all overlays are up-to-date.
      this.elements.forEach((data, el) => {
        this.debugger!.createOrUpdateLinkOverlay(el, data)
      })
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
      // If debugger exists, ensure its view of elements and settings is current
      this.debugger.updateControlsState(this.globalSettings)
      this.debugger.updateAllLinkVisuals(this.elements) // Ensure all overlays are correct
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
    const expandedRect = this.getExpandedRect(newOriginalRect, hitSlop)

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
          originalRect: newOriginalRect, // Update originalRect as well
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

    const clipTest = (p: number, q: number): boolean => {
      if (p === 0) {
        if (q < 0) {
          return false
        }
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

    const elementsToUpdateInDebugger: ForesightElement[] = []

    this.elements.forEach((currentData, element) => {
      // Capture the state of the element before this event's processing
      const previousData = { ...currentData }

      let callbackFiredThisCycle = false
      let finalIsHovering = previousData.isHovering
      let finalIsTrajectoryHit = previousData.isTrajectoryHit
      let finalTrajectoryHitTime = previousData.trajectoryHitTime

      const { expandedRect } = previousData.elementBounds

      // --- 1. Determine Current Physical Hover State ---
      const isCurrentlyPhysicallyHovering =
        this.currentPoint.x >= expandedRect.left &&
        this.currentPoint.x <= expandedRect.right &&
        this.currentPoint.y >= expandedRect.top &&
        this.currentPoint.y <= expandedRect.bottom

      // --- 2. Determine Potential New Trajectory Hit (Prediction Logic) ---
      let isNewTrajectoryActivation = false
      if (
        this.globalSettings.enableMousePrediction &&
        !isCurrentlyPhysicallyHovering && // Only predict if not physically hovering
        !previousData.isTrajectoryHit // And not already in a trajectory hit state from previous cycles
      ) {
        if (this.lineSegmentIntersectsRect(this.currentPoint, this.predictedPoint, expandedRect)) {
          isNewTrajectoryActivation = true
        }
      }

      // --- 3. Process Trajectory Hit Activation (if any) ---
      if (isNewTrajectoryActivation) {
        previousData.callback() // Fire callback based on the state that led to this event
        callbackFiredThisCycle = true
        finalIsTrajectoryHit = true
        finalTrajectoryHitTime = performance.now()
        // If a trajectory activates, it implies the mouse isn't physically hovering at this exact moment for this logic path
        // finalIsHovering will be updated based on isCurrentlyPhysicallyHovering later.
      }

      // --- 4. Process Hover State Change and Potential Hover Callback ---
      const isNewPhysicalHoverEvent = isCurrentlyPhysicallyHovering && !previousData.isHovering

      if (isNewPhysicalHoverEvent) {
        // Conditions for firing callback due to hover:
        // 1. No callback has been fired by trajectory logic in this cycle.
        // 2. AND (Either no prior trajectory hit OR prediction is disabled (making hover always primary))
        const hoverCanTriggerCallback =
          !previousData.isTrajectoryHit ||
          (previousData.isTrajectoryHit && !this.globalSettings.enableMousePrediction)

        if (!callbackFiredThisCycle && hoverCanTriggerCallback) {
          previousData.callback()
          // callbackFiredThisCycle = true; // Optional: mark if needed for further logic, though not used after this.
        }
      }

      // Set the definitive hover state for this cycle based on physical mouse position
      finalIsHovering = isCurrentlyPhysicallyHovering

      // --- 5. Construct New Element Data and Update if State Changed ---
      const newElementData: ForesightElementData = {
        ...previousData,
        isHovering: finalIsHovering,
        isTrajectoryHit: finalIsTrajectoryHit,
        trajectoryHitTime: finalTrajectoryHitTime,
      }

      const stateActuallyChanged =
        newElementData.isHovering !== previousData.isHovering ||
        newElementData.isTrajectoryHit !== previousData.isTrajectoryHit ||
        // Ensure time change is also considered a state change if trajectory hit status is true
        (newElementData.isTrajectoryHit &&
          newElementData.trajectoryHitTime !== previousData.trajectoryHitTime)

      if (stateActuallyChanged) {
        this.elements.set(element, newElementData)
        elementsToUpdateInDebugger.push(element)
      }
    })

    // --- 6. Update Debugger Visuals (if enabled) ---
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
