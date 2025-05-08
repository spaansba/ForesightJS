"use client"
import { IntentDebugger } from "./ForesightDebugger"
import type {
  IntentCallback,
  IntentManagerProps,
  LinkData,
  LinkElement,
  MousePosition,
  Point,
  Rect,
} from "../types/types"

export class IntentManager {
  private static instance: IntentManager
  private links: Map<LinkElement, LinkData> = new Map()

  private isSetup: boolean = false
  private debugMode: boolean = false
  private debugger: IntentDebugger | null = null

  private positionHistorySize = 6
  private trajectoryPredictionTime = 50
  private positions: MousePosition[] = []
  private enableMouseTrajectory: boolean = true
  private currentPoint: Point = { x: 0, y: 0 }
  private predictedPoint: Point = { x: 0, y: 0 }

  private lastResizeScrollCallTimestamp: number = 0
  private resizeScrollThrottleTimeoutId: ReturnType<typeof setTimeout> | null = null
  private readonly resizeScrollThrottleDelay: number = 50

  private constructor() {
    setInterval(this.checkTrajectoryHitExpiration.bind(this), 100)
  }

  public static initialize(props?: Partial<IntentManagerProps>): IntentManager {
    if (!IntentManager.instance) {
      IntentManager.instance = new IntentManager()
    }
    if (props) {
      IntentManager.instance.setTrajectorySettings({
        historySize: props.positionHistorySize,
        predictionTime: props.trajectoryPredictionTime,
        enabled: props.enableMouseTrajectory,
      })
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

    return IntentManager.instance
  }

  public static getInstance() {
    if (!IntentManager.instance) {
      return this.initialize()
    }
    return IntentManager.instance
  }

  private checkTrajectoryHitExpiration(): void {
    const now = performance.now()
    let needsVisualUpdate = false
    const updatedLinkElements: LinkElement[] = []

    this.links.forEach((linkData, element) => {
      if (linkData.isTrajectoryHit && now - linkData.trajectoryHitTime > 300) {
        this.links.set(element, {
          ...linkData,
          isTrajectoryHit: false,
        })
        needsVisualUpdate = true
        updatedLinkElements.push(element)
      }
    })

    if (needsVisualUpdate && this.debugMode && this.debugger) {
      updatedLinkElements.forEach((element) => {
        const data = this.links.get(element)
        if (data && this.debugger) {
          console.log("asda")
          this.debugger.createOrUpdateLinkOverlay(element, data)
        }
      })
    }
  }

  public register(element: LinkElement, callback: IntentCallback): () => void {
    const newLinkData: LinkData = {
      callback,
      expandedRect: null,
      isHovering: false,
      isTrajectoryHit: false,
      trajectoryHitTime: 0,
    }
    this.links.set(element, newLinkData)

    this.updateExpandedRect(element) // This will also update debug visuals if active
    this.setupGlobalListeners()

    if (this.debugMode && this.debugger) {
      const data = this.links.get(element)
      if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
    }

    return () => this.unregister(element)
  }

  private unregister(element: LinkElement): void {
    this.links.delete(element)

    if (this.debugMode && this.debugger) {
      this.debugger.removeLinkOverlay(element)
    }

    if (this.links.size === 0 && this.isSetup) {
      this.removeGlobalListeners()
    }
  }

  public setTrajectorySettings(settings: {
    historySize?: number
    predictionTime?: number
    enabled?: boolean
  }): void {
    let changed = false
    if (settings.historySize !== undefined && this.positionHistorySize !== settings.historySize) {
      this.positionHistorySize = settings.historySize
      while (this.positions.length > this.positionHistorySize) {
        this.positions.shift()
      }
      changed = true
    }

    if (
      settings.predictionTime !== undefined &&
      this.trajectoryPredictionTime !== settings.predictionTime
    ) {
      this.trajectoryPredictionTime = settings.predictionTime
      changed = true
    }

    if (settings.enabled !== undefined && this.enableMouseTrajectory !== settings.enabled) {
      this.enableMouseTrajectory = settings.enabled
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

  private getExpandedRect(baseRect: Rect, hitSlop: Rect): Rect {
    return {
      left: baseRect.left - hitSlop.left,
      right: baseRect.right + hitSlop.right,
      top: baseRect.top - hitSlop.top,
      bottom: baseRect.bottom + hitSlop.bottom,
    }
  }

  private updateExpandedRect(element: LinkElement): void {
    const linkData = this.links.get(element)
    if (!linkData) return

    const expandedRect = this.getExpandedRect(element.getBoundingClientRect(), {
      top: 100,
      left: 100,
      right: 100,
      bottom: 100,
    })

    if (expandedRect != linkData.expandedRect) {
      console.log("updating rect")
      this.links.set(element, {
        ...linkData,
        expandedRect,
      })
    }

    if (this.debugMode && this.debugger) {
      const updatedData = this.links.get(element)
      if (updatedData) this.debugger.createOrUpdateLinkOverlay(element, updatedData)
    }
  }

  private updateAllRects(): void {
    this.links.forEach((_, element) => {
      this.updateExpandedRect(element)
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

    const linksToUpdateInDebugger: LinkElement[] = []

    this.links.forEach((linkData, element) => {
      if (!linkData.expandedRect) return

      const { isHoveringInArea, shouldRunCallback } = this.isMouseInExpandedArea(
        linkData.expandedRect,
        this.currentPoint,
        linkData.isHovering
      )

      let linkStateChanged = false

      if (this.enableMouseTrajectory && !isHoveringInArea) {
        if (
          this.pointIntersectsRect(
            this.predictedPoint.x,
            this.predictedPoint.y,
            linkData.expandedRect
          )
        ) {
          if (!linkData.isTrajectoryHit) {
            linkData.callback()
            console.log("trajectory")
            this.links.set(element, {
              ...linkData,
              isTrajectoryHit: true,
              trajectoryHitTime: performance.now(),
              isHovering: isHoveringInArea,
            })
            linkStateChanged = true
          }
        }
      }

      if (linkData.isHovering !== isHoveringInArea) {
        this.links.set(element, {
          ...linkData,
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
          !linkData.isTrajectoryHit ||
          (linkData.isTrajectoryHit && !this.enableMouseTrajectory)
        ) {
          linkData.callback()
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
