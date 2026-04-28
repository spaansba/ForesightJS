import { lineSegmentIntersectsRect } from "../helpers/lineSegmentIntersectsRect"
import { predictNextMousePosition } from "../helpers/predictNextMousePosition"
import { isPointInRectangle } from "../helpers/rectAndHitSlop"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import type { MouseTrajectoryUpdateEvent, TrajectoryPositions } from "../types/types"

interface MousePredictorConfig {
  dependencies: ForesightModuleDependencies
  trajectoryPositions: TrajectoryPositions
}

export class MousePredictor extends BaseForesightModule {
  protected readonly moduleName = "MousePredictor"

  private trajectoryPositions: TrajectoryPositions

  // Pre-allocated event object to avoid creating a new object every frame (~60/sec)
  private readonly mouseTrajectoryEvent: MouseTrajectoryUpdateEvent

  constructor(config: MousePredictorConfig) {
    super(config.dependencies)

    this.trajectoryPositions = config.trajectoryPositions
    this.mouseTrajectoryEvent = {
      type: "mouseTrajectoryUpdate",
      predictionEnabled: false,
      trajectoryPositions: this.trajectoryPositions,
    }
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

    for (const internal of this.elements.values()) {
      const state = internal.state
      if (!state.isIntersectingWithViewport || !state.isActive || state.isPredicted) {
        continue
      }

      const expandedRect = state.elementBounds.expandedRect

      if (!enablePrediction) {
        if (isPointInRectangle(currentPoint, expandedRect)) {
          this.callCallback(internal, { kind: "mouse", subType: "hover" })

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
        this.callCallback(internal, { kind: "mouse", subType: "trajectory" })
      }
    }

    if (this.hasListeners("mouseTrajectoryUpdate")) {
      this.mouseTrajectoryEvent.predictionEnabled = enablePrediction
      this.emit(this.mouseTrajectoryEvent)
    }
  }

  protected onDisconnect(): void {}
  protected onConnect(): void {}
}
