"use client"
import { ForesightDebugger } from "./ForesightDebugger"
import type {
  ForesightCallback,
  ForesightManagerProps,
  ElementData,
  ForesightElement,
  MousePosition,
  Point,
  Rect,
} from "../types/types"

export class ForesightManager {
  private static manager: ForesightManager
  private links: Map<ForesightElement, ElementData> = new Map()

  private isSetup: boolean = false
  private debugMode: boolean = false // Synced with globalSettings.debug
  private debugger: ForesightDebugger | null = null

  private globalSettings: ForesightManagerProps = {
    debug: false,
    enableMouseTrajectory: true,
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
      console.error(
        "ForesightManager is already initialized. Use alterGlobalSettings to update settings. Make sure to not put the ForesightManager.initialize() in a place that rerenders often."
      )
      ForesightManager.manager.alterGlobalSettings(props)
    }
    ForesightManager.manager.debugMode = ForesightManager.manager.globalSettings.debug
    return ForesightManager.manager
  }

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

    this.links.forEach((elementData, element) => {
      if (elementData.isTrajectoryHit && now - elementData.trajectoryHitTime > 100) {
        this.links.set(element, {
          ...elementData,
          isTrajectoryHit: false,
        })
        needsVisualUpdate = true
        updatedForesightElements.push(element)
      }
    })

    if (needsVisualUpdate && this.debugMode && this.debugger) {
      updatedForesightElements.forEach((element) => {
        const data = this.links.get(element)
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

  public register(
    element: ForesightElement,
    callback: ForesightCallback,
    hitSlop?: number | Rect
  ): () => void {
    const normalizedHitSlop = hitSlop
      ? this.normalizeHitSlop(hitSlop)
      : (this.globalSettings.defaultHitSlop as Rect) // Already normalized in constructor
    const originalRect = element.getBoundingClientRect()
    const newElementData: ElementData = {
      callback,
      elementBounds: {
        expandedRect: this.getExpandedRect(originalRect, normalizedHitSlop),
        originalRect: originalRect,
        hitSlop: normalizedHitSlop,
      },
      isHovering: false,
      isTrajectoryHit: false,
      trajectoryHitTime: 0,
    }
    this.links.set(element, newElementData)
    this.setupGlobalListeners()
    if (this.debugMode && this.debugger) {
      const data = this.links.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
    }

    return () => this.unregister(element)
  }

  private unregister(element: ForesightElement): void {
    this.links.delete(element)
    if (this.debugMode && this.debugger) {
      this.debugger.removeLinkOverlay(element)
    }
    if (this.links.size === 0 && this.isSetup) {
      this.removeGlobalListeners()
    }
  }

  public alterGlobalSettings(props?: Partial<ForesightManagerProps>): void {
    let settingsActuallyChanged = false

    if (
      props?.positionHistorySize !== undefined &&
      this.globalSettings.positionHistorySize !== props.positionHistorySize
    ) {
      this.globalSettings.positionHistorySize = props.positionHistorySize
      while (this.positions.length > this.globalSettings.positionHistorySize) {
        this.positions.shift()
      }
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
      props?.enableMouseTrajectory !== undefined &&
      this.globalSettings.enableMouseTrajectory !== props.enableMouseTrajectory
    ) {
      this.globalSettings.enableMouseTrajectory = props.enableMouseTrajectory
      settingsActuallyChanged = true
    }

    if (props?.defaultHitSlop !== undefined) {
      const newSlop = this.normalizeHitSlop(props.defaultHitSlop)
      if (JSON.stringify(this.globalSettings.defaultHitSlop) !== JSON.stringify(newSlop)) {
        this.globalSettings.defaultHitSlop = newSlop
        settingsActuallyChanged = true
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
        this.globalSettings.enableMouseTrajectory
      )
    }
  }

  private turnOnDebugMode() {
    this.debugMode = true
    if (!this.debugger) {
      this.debugger = new ForesightDebugger(this)
      this.debugger.initialize(
        this.links,
        this.globalSettings,
        this.currentPoint,
        this.predictedPoint
      )
    } else {
      this.debugger.updateControlsState(this.globalSettings)
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMouseTrajectory
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
    const elementData = this.links.get(element)
    if (!elementData) return

    const expandedRect = this.getExpandedRect(element.getBoundingClientRect(), hitSlop)

    if (JSON.stringify(expandedRect) !== JSON.stringify(elementData.elementBounds.expandedRect)) {
      this.links.set(element, {
        ...elementData,
        elementBounds: {
          ...elementData.elementBounds,
          expandedRect,
        },
      })
    }

    if (this.debugMode && this.debugger) {
      const updatedData = this.links.get(element)
      if (updatedData) this.debugger.createOrUpdateLinkOverlay(element, updatedData)
    }
  }

  private updateAllRects(): void {
    this.links.forEach((data, element) => {
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
    this.predictedPoint = this.globalSettings.enableMouseTrajectory
      ? this.predictMousePosition(this.currentPoint)
      : this.currentPoint

    const linksToUpdateInDebugger: ForesightElement[] = []

    this.links.forEach((elementData, element) => {
      if (!elementData.elementBounds.expandedRect) return

      const { isHoveringInArea, shouldRunCallback } = this.isMouseInExpandedArea(
        elementData.elementBounds.expandedRect,
        this.currentPoint,
        elementData.isHovering
      )

      let linkStateChanged = false

      if (this.globalSettings.enableMouseTrajectory && !isHoveringInArea) {
        // Check if the trajectory line segment intersects the expanded rect
        if (
          this.lineSegmentIntersectsRect(
            this.currentPoint,
            this.predictedPoint,
            elementData.elementBounds.expandedRect
          )
        ) {
          if (!elementData.isTrajectoryHit) {
            elementData.callback()
            this.links.set(element, {
              ...elementData,
              isTrajectoryHit: true,
              trajectoryHitTime: performance.now(),
              isHovering: isHoveringInArea, // isHoveringInArea is false here
            })
            linkStateChanged = true
          }
        }
        // Note: No 'else' here to turn off isTrajectoryHit immediately.
        // It's managed by checkTrajectoryHitExpiration or when actual hover occurs.
      }

      if (elementData.isHovering !== isHoveringInArea) {
        this.links.set(element, {
          ...elementData,
          isHovering: isHoveringInArea,
          // Preserve trajectory hit state if it was already hit,
          // unless actual hover is now false and trajectory also doesn't hit
          // (though trajectory hit is primarily for non-hovering states)
          isTrajectoryHit: this.links.get(element)!.isTrajectoryHit,
          trajectoryHitTime: this.links.get(element)!.trajectoryHitTime,
        })
        linkStateChanged = true
      }

      if (linkStateChanged) {
        linksToUpdateInDebugger.push(element)
      }

      if (shouldRunCallback) {
        if (
          !elementData.isTrajectoryHit ||
          (elementData.isTrajectoryHit && !this.globalSettings.enableMouseTrajectory)
        ) {
          elementData.callback()
        }
      }
    })

    if (this.debugMode && this.debugger) {
      linksToUpdateInDebugger.forEach((element) => {
        const data = this.links.get(element)
        if (data) this.debugger!.createOrUpdateLinkOverlay(element, data)
      })
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.globalSettings.enableMouseTrajectory
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
