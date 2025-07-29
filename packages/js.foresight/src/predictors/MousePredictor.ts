import { lineSegmentIntersectsRect } from "../helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "../helpers/predictNextMousePosition"
import { isPointInRectangle } from "../helpers/rectAndHitSlop"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import type { TrajectoryPositions } from "../types/types"

export interface MousePredictorSettings {
  enableMousePrediction: boolean
  trajectoryPredictionTime: number
  positionHistorySize: number
}

export interface MousePredictorConfig {
  dependencies: ForesightModuleDependencies
  trajectoryPositions: TrajectoryPositions
}

export class MousePredictor extends BaseForesightModule {
  protected readonly moduleName = "MousePredictor"
  
  private trajectoryPositions: TrajectoryPositions

  constructor(config: MousePredictorConfig) {
    super(config.dependencies)
    this.trajectoryPositions = config.trajectoryPositions
  }

  protected onDisconnect(): void {}

  protected onConnect(): void {}

  private updatePointerState(e: MouseEvent): void {
    const currentPoint = { x: e.clientX, y: e.clientY }
    this.trajectoryPositions.currentPoint = currentPoint
    if (this.settings.enableMousePrediction) {
      this.trajectoryPositions.predictedPoint = predictNextMousePosition(
        currentPoint,
        this.trajectoryPositions.positions,
        this.settings.trajectoryPredictionTime
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

        if (!this.settings.enableMousePrediction) {
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
        predictionEnabled: this.settings.enableMousePrediction,
        trajectoryPositions: this.trajectoryPositions,
      })
    } catch (error) {
      this.handleError(error, "processMouseMovement")
    }
  }
}
