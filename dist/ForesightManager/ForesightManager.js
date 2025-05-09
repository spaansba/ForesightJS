"use client"
import { IntentDebugger } from "./ForesightDebugger"
export class ForesightManager {
  static instance
  links = new Map()
  isSetup = false
  debugMode = false
  debugger = null
  positionHistorySize = 6
  trajectoryPredictionTime = 50
  positions = []
  enableMouseTrajectory = true
  currentPoint = { x: 0, y: 0 }
  predictedPoint = { x: 0, y: 0 }
  lastResizeScrollCallTimestamp = 0
  resizeScrollThrottleTimeoutId = null
  resizeScrollThrottleDelay = 50
  constructor() {
    setInterval(this.checkTrajectoryHitExpiration.bind(this), 100)
  }
  static initialize(props) {
    if (!ForesightManager.instance) {
      ForesightManager.instance = new ForesightManager()
    }
    if (props) {
      ForesightManager.instance.setTrajectorySettings({
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
    return ForesightManager.instance
  }
  static getInstance() {
    if (!ForesightManager.instance) {
      return this.initialize()
    }
    return ForesightManager.instance
  }
  checkTrajectoryHitExpiration() {
    const now = performance.now()
    let needsVisualUpdate = false
    const updatedLinkElements = []
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
          this.debugger.createOrUpdateLinkOverlay(element, data)
        }
      })
    }
  }
  register(element, callback) {
    const newLinkData = {
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
  unregister(element) {
    this.links.delete(element)
    if (this.debugMode && this.debugger) {
      this.debugger.removeLinkOverlay(element)
    }
    if (this.links.size === 0 && this.isSetup) {
      this.removeGlobalListeners()
    }
  }
  setTrajectorySettings(settings) {
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
  turnOnDebugMode() {
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
  getExpandedRect(baseRect, hitSlop) {
    return {
      left: baseRect.left - hitSlop.left,
      right: baseRect.right + hitSlop.right,
      top: baseRect.top - hitSlop.top,
      bottom: baseRect.bottom + hitSlop.bottom,
    }
  }
  updateExpandedRect(element) {
    const linkData = this.links.get(element)
    if (!linkData) return
    const expandedRect = this.getExpandedRect(element.getBoundingClientRect(), {
      top: 100,
      left: 100,
      right: 100,
      bottom: 100,
    })
    if (expandedRect != linkData.expandedRect) {
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
  updateAllRects() {
    this.links.forEach((_, element) => {
      this.updateExpandedRect(element)
    })
  }
  predictMousePosition = (point) => {
    const now = performance.now()
    const currentPosition = { point, time: now }
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
  pointIntersectsRect = (x, y, rect) => {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }
  isMouseInExpandedArea = (area, clientPoint, isAlreadyHovering) => {
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
  handleMouseMove = (e) => {
    this.currentPoint = { x: e.clientX, y: e.clientY }
    this.predictedPoint = this.enableMouseTrajectory
      ? this.predictMousePosition(this.currentPoint)
      : this.currentPoint
    const linksToUpdateInDebugger = []
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
          isTrajectoryHit: this.links.get(element).isTrajectoryHit,
          trajectoryHitTime: this.links.get(element).trajectoryHitTime,
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
        if (data) this.debugger.createOrUpdateLinkOverlay(element, data)
      })
      this.debugger.updateTrajectoryVisuals(
        this.currentPoint,
        this.predictedPoint,
        this.enableMouseTrajectory
      )
    }
  }
  // Throttled handler for resize and scroll events
  handleResizeOrScroll = () => {
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
  setupGlobalListeners() {
    if (this.isSetup) return
    document.addEventListener("mousemove", this.handleMouseMove)
    // Use the throttled handler for resize and scroll
    window.addEventListener("resize", this.handleResizeOrScroll)
    window.addEventListener("scroll", this.handleResizeOrScroll)
    this.isSetup = true
  }
  removeGlobalListeners() {
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
