"use client"
import { IntentDebugger } from "./ForesightDebugger"
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
  private static instance: ForesightManager
  private links: Map<ForesightElement, ElementData> = new Map()

  private isSetup: boolean = false
  private debugMode: boolean = false
  private debugger: IntentDebugger | null = null

  private positionHistorySize = 6
  private trajectoryPredictionTime = 50
  private defaultHitSlop: Rect = { top: 0, left: 0, right: 0, bottom: 0 }
  private positions: MousePosition[] = []
  private enableMouseTrajectory: boolean = true
  private currentPoint: Point = { x: 0, y: 0 }
  private predictedPoint: Point = { x: 0, y: 0 }

  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null
  private resizeScrollThrottleDelay: number = 50

  private constructor() {
    setInterval(this.checkTrajectoryHitExpiration.bind(this), 100)
  }

  public static initialize(props?: Partial<ForesightManagerProps>): ForesightManager {
    if (!ForesightManager.instance) {
      ForesightManager.instance = new ForesightManager()
    }
    if (props) {
      ForesightManager.instance.setTrajectorySettings(props)
    }
    if (props?.debug) {
      this.instance.turnOnDebugMode()
    } else {
      if (this.instance.debugger) {
        this.instance.debugMode = false
        this.instance.debugger.cleanup()
        this.instance.debugger = null
      }
    }

    return ForesightManager.instance
  }

  public static getInstance() {
    if (!ForesightManager.instance) {
      return this.initialize()
    }
    return ForesightManager.instance
  }

  private checkTrajectoryHitExpiration(): void {
    const now = performance.now()
    let needsVisualUpdate = false
    const updatedForesightElements: ForesightElement[] = []

    this.links.forEach((elementData, element) => {
      if (elementData.isTrajectoryHit && now - elementData.trajectoryHitTime > 300) {
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
    const normalizedHitSlop = hitSlop ? this.normalizeHitSlop(hitSlop) : this.defaultHitSlop
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

  public setTrajectorySettings(props?: Partial<ForesightManagerProps>): void {
    let changed = false
    if (
      props?.positionHistorySize !== undefined &&
      this.positionHistorySize !== props.positionHistorySize
    ) {
      this.positionHistorySize = props.positionHistorySize
      while (this.positions.length > this.positionHistorySize) {
        this.positions.shift()
      }
      changed = true
    }

    if (
      props?.trajectoryPredictionTime !== undefined &&
      this.trajectoryPredictionTime !== props?.trajectoryPredictionTime
    ) {
      this.trajectoryPredictionTime = props?.trajectoryPredictionTime
      changed = true
    }

    if (
      props?.enableMouseTrajectory !== undefined &&
      this.enableMouseTrajectory !== props?.enableMouseTrajectory
    ) {
      this.enableMouseTrajectory = props?.enableMouseTrajectory
      changed = true
    }

    if (props?.defaultHitSlop !== undefined) {
      this.defaultHitSlop = this.normalizeHitSlop(props?.defaultHitSlop)
      changed = true
    }

    if (changed && this.debugMode && this.debugger) {
      this.debugger.updateControlsState({
        positionHistorySize: this.positionHistorySize,
        trajectoryPredictionTime: this.trajectoryPredictionTime,
        enableMouseTrajectory: this.enableMouseTrajectory,
      })
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.enableMouseTrajectory
      )
    }
  }

  private turnOnDebugMode() {
    this.debugMode = true
    if (!this.debugger) {
      this.debugger = new IntentDebugger(this)

      this.debugger.initialize(
        this.links,
        {
          positionHistorySize: this.positionHistorySize,
          trajectoryPredictionTime: this.trajectoryPredictionTime,
          enableMouseTrajectory: this.enableMouseTrajectory,
        },
        this.currentPoint,
        this.predictedPoint
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

    if (expandedRect != elementData.elementBounds.expandedRect) {
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
    if (this.positions.length > this.positionHistorySize) {
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

    const trajectoryPredictionTimeInSeconds = this.trajectoryPredictionTime / 1000
    const predictedX = x + vx * trajectoryPredictionTimeInSeconds
    const predictedY = y + vy * trajectoryPredictionTimeInSeconds
    return { x: predictedX, y: predictedY }
  }

  private pointIntersectsRect = (x: number, y: number, rect: Rect): boolean => {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
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
    this.predictedPoint = this.enableMouseTrajectory
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

      if (this.enableMouseTrajectory && !isHoveringInArea) {
        if (
          this.pointIntersectsRect(
            this.predictedPoint.x,
            this.predictedPoint.y,
            elementData.elementBounds.expandedRect
          )
        ) {
          if (!elementData.isTrajectoryHit) {
            elementData.callback()
            console.log("trajectory")
            this.links.set(element, {
              ...elementData,
              isTrajectoryHit: true,
              trajectoryHitTime: performance.now(),
              isHovering: isHoveringInArea,
            })
            linkStateChanged = true
          }
        }
      }

      if (elementData.isHovering !== isHoveringInArea) {
        this.links.set(element, {
          ...elementData,
          isHovering: isHoveringInArea,
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
          (elementData.isTrajectoryHit && !this.enableMouseTrajectory)
        ) {
          elementData.callback()
          console.log("hover")
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
        this.enableMouseTrajectory
      )
    }
  }

  // Throttled handler for resize and scroll events
  private handleResizeOrScroll = (): void => {
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
    }

    const now = performance.now()
    const timeSinceLastCall = now - this.lastResizeScrollCallTimestamp

    if (timeSinceLastCall >= this.resizeScrollThrottleDelay) {
      this.updateAllRects()
      this.lastResizeScrollCallTimestamp = now
      this.resizeScrollThrottleTimeoutId = null
    } else {
      this.resizeScrollThrottleTimeoutId = setTimeout(() => {
        this.updateAllRects()
        this.lastResizeScrollCallTimestamp = performance.now()
        this.resizeScrollThrottleTimeoutId = null
      }, this.resizeScrollThrottleDelay - timeSinceLastCall)
    }
  }

  private setupGlobalListeners(): void {
    if (this.isSetup) return
    document.addEventListener("mousemove", this.handleMouseMove)
    // Use the throttled handler for resize and scroll
    window.addEventListener("resize", this.handleResizeOrScroll)
    window.addEventListener("scroll", this.handleResizeOrScroll)
    this.isSetup = true
  }

  private removeGlobalListeners(): void {
    document.removeEventListener("mousemove", this.handleMouseMove)
    // Remove the throttled handler for resize and scroll
    window.removeEventListener("resize", this.handleResizeOrScroll)
    window.removeEventListener("scroll", this.handleResizeOrScroll)

    // Clear any pending timeout for the throttled handler
    if (this.resizeScrollThrottleTimeoutId) {
      clearTimeout(this.resizeScrollThrottleTimeoutId)
      this.resizeScrollThrottleTimeoutId = null
    }
    this.isSetup = false
  }
}
