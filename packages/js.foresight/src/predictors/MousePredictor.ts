import { lineSegmentIntersectsRect } from "../helpers/lineSegmentIntersectsRect"
import { createMouseHistory, predictNextMousePosition } from "../helpers/predictNextMousePosition"
import { isPointInRectangle } from "../helpers/rectAndHitSlop"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import type { MouseTrajectoryUpdateEvent, TrajectoryPositions } from "../types/types"

interface MousePredictorConfig {
  dependencies: ForesightModuleDependencies
  trajectoryPositions: TrajectoryPositions
}

export class MousePredictor extends BaseForesightModule {
  private trajectoryPositions: TrajectoryPositions
  private history = createMouseHistory()

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

    if (this.deps.settings.enableMousePrediction) {
      predictNextMousePosition(
        currentPoint,
        e.timeStamp,
        this.history,
        this.deps.settings.trajectoryPredictionTime,
        this.trajectoryPositions.predictedPoint // reuse existing object
      )
    } else {
      this.trajectoryPositions.predictedPoint.x = currentPoint.x
      this.trajectoryPositions.predictedPoint.y = currentPoint.y
    }
  }

  public processMouseMovement(e: MouseEvent): void {
    this.updatePointerState(e)
    const enablePrediction = this.deps.settings.enableMousePrediction
    const currentPoint = this.trajectoryPositions.currentPoint

    for (const internal of this.deps.scannableElements) {
      const expandedRect = internal.bounds.expandedRect

      if (!enablePrediction) {
        if (isPointInRectangle(currentPoint, expandedRect)) {
          this.deps.callCallback(internal, { kind: "mouse", subType: "hover" })

          continue
        }

        // when enable mouse prediction is off, we only check if the mouse is physically hovering over the element
      } else if (
        lineSegmentIntersectsRect(
          currentPoint,
          this.trajectoryPositions.predictedPoint,
          expandedRect
        )
      ) {
        this.deps.callCallback(internal, { kind: "mouse", subType: "trajectory" })
      }
    }

    if (this.deps.hasListeners("mouseTrajectoryUpdate")) {
      this.mouseTrajectoryEvent.predictionEnabled = enablePrediction
      this.deps.emit(this.mouseTrajectoryEvent)
    }
  }
}
