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

  private updatePointerState(e: MouseEvent): void {
    // Mutate existing point objects instead of creating new ones (perf optimization)
    const currentPoint = this.trajectoryPositions.currentPoint
    currentPoint.x = e.clientX
    currentPoint.y = e.clientY

    if (this.settings.enableMousePrediction) {
      predictNextMousePosition(
        currentPoint,
        this.trajectoryPositions.positions,
        this.settings.trajectoryPredictionTime,
        this.trajectoryPositions.predictedPoint // reuse existing object
      )
    } else {
      this.trajectoryPositions.predictedPoint.x = currentPoint.x
      this.trajectoryPositions.predictedPoint.y = currentPoint.y
    }
  }

  public processMouseMovement(e: MouseEvent): void {
    this.updatePointerState(e)
    const enablePrediction = this.settings.enableMousePrediction
    const currentPoint = this.trajectoryPositions.currentPoint

    for (const currentData of this.elements.values()) {
      if (
        !currentData.isIntersectingWithViewport ||
        !currentData.callbackInfo.isCallbackActive ||
        currentData.callbackInfo.isRunningCallback
      ) {
        continue
      }

      const expandedRect = currentData.elementBounds.expandedRect

      if (!enablePrediction) {
        if (isPointInRectangle(currentPoint, expandedRect)) {
          this.callCallback(currentData, { kind: "mouse", subType: "hover" })
          return
        }

        // when enable mouse prediction is off, we only check if the mouse is physically hovering over the element
      } else if (
        lineSegmentIntersectsRect(
          currentPoint,
          this.trajectoryPositions.predictedPoint,
          expandedRect
        )
      ) {
        this.callCallback(currentData, { kind: "mouse", subType: "trajectory" })
      }
    }

    if (this.hasListeners("mouseTrajectoryUpdate")) {
      this.emit({
        type: "mouseTrajectoryUpdate",
        predictionEnabled: enablePrediction,
        trajectoryPositions: this.trajectoryPositions,
      })
    }
  }

  protected onDisconnect(): void {}
  protected onConnect(): void {}
}
