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
  protected initializeListeners() {}
  public cleanup(): void {}
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

  public processMouseMovement(e: MouseEvent): void {
    try {
      this.updatePointerState(e)

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
