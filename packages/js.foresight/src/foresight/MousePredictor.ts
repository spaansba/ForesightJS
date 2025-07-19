import { lineSegmentIntersectsRect } from "../helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "../helpers/predictNextMousePosition"
import { isPointInRectangle } from "../helpers/rectAndHitSlop"
import { BasePredictor, type BasePredictorConfig } from "./BasePredictor"
import type { TrajectoryPositions } from "../types/types"

export interface MousePredictorSettings {
  enableMousePrediction: boolean
  trajectoryPredictionTime: number
  positionHistorySize: number
}

export interface MousePredictorConfig extends BasePredictorConfig {
  settings: MousePredictorSettings
  trajectoryPositions: TrajectoryPositions
}

export class MousePredictor extends BasePredictor {
  private pendingMouseEvent: MouseEvent | null = null
  private rafId: number | null = null
  private enableMousePrediction: boolean
  public trajectoryPredictionTime: number
  public positionHistorySize: number
  private trajectoryPositions: TrajectoryPositions

  constructor(config: MousePredictorConfig) {
    super(config)
    this.enableMousePrediction = config.settings.enableMousePrediction
    this.trajectoryPredictionTime = config.settings.trajectoryPredictionTime
    this.positionHistorySize = config.settings.positionHistorySize
    this.trajectoryPositions = config.trajectoryPositions
    this.initializeListeners()
  }
  protected initializeListeners() {
    const { signal } = this.abortController
    document.addEventListener("mousemove", this.handleMouseMove, { signal })
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.pendingMouseEvent = e
    if (this.rafId) return

    this.rafId = requestAnimationFrame(() => {
      if (this.pendingMouseEvent) {
        this.processMouseMovement(this.pendingMouseEvent)
      }
      this.rafId = null
    })
  }
  private updatePointerState(e: MouseEvent): void {
    const currentPoint = { x: e.clientX, y: e.clientY }
    this.trajectoryPositions.currentPoint = currentPoint
    if (this.enableMousePrediction) {
      this.trajectoryPositions.predictedPoint = predictNextMousePosition(
        currentPoint,
        this.trajectoryPositions.positions,
        this.trajectoryPredictionTime
      )
    } else {
      this.trajectoryPositions.predictedPoint = currentPoint
    }
  }

  public cleanup(): void {
    this.abort()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.pendingMouseEvent = null
  }

  private processMouseMovement(e: MouseEvent): void {
    try {
      this.updatePointerState(e)

      // Use for...of instead of forEach for better performance in hot code path
      // Avoids function call overhead and iterator creation on every mouse move
      for (const currentData of this.elements.values()) {
        if (
          !currentData.isIntersectingWithViewport ||
          !currentData.callbackInfo.isCallbackActive ||
          currentData.callbackInfo.isRunningCallback
        ) {
          continue
        }

        const expandedRect = currentData.elementBounds.expandedRect

        if (!this.enableMousePrediction) {
          if (isPointInRectangle(this.trajectoryPositions.currentPoint, expandedRect)) {
            this.callCallback(currentData, { kind: "mouse", subType: "hover" })
            return
          }
          // when enable mouse prediction is off, we only check if the mouse is physically hovering over the element
        } else if (
          lineSegmentIntersectsRect(
            this.trajectoryPositions.currentPoint,
            this.trajectoryPositions.predictedPoint,
            expandedRect
          )
        ) {
          this.callCallback(currentData, { kind: "mouse", subType: "trajectory" })
        }
      }

      this.emit({
        type: "mouseTrajectoryUpdate",
        predictionEnabled: this.enableMousePrediction,
        trajectoryPositions: this.trajectoryPositions,
      })
    } catch (error) {
      this.handleError(error, "processMouseMovement")
    }
  }
}
