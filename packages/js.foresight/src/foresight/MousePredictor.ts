import { lineSegmentIntersectsRect } from "js.foresight/helpers/lineSigmentIntersectsRect"
import { predictNextMousePosition } from "js.foresight/helpers/predictNextMousePosition"
import { isPointInRectangle } from "js.foresight/helpers/rectAndHitSlop"
import type {
  CallCallbackFunction,
  EmitFunction,
  ForesightElement,
  ForesightElementData,
  TrajectoryPositions,
} from "js.foresight/types/types"
import { BasePredictor } from "./BasePredictor"

export class MousePredictor extends BasePredictor {
  private pendingMouseEvent: MouseEvent | null = null
  private rafId: number | null = null
  public trajectoryPositions: TrajectoryPositions = {
    positions: [],
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }
  private enableMousePrediction: boolean
  public trajectoryPredictionTime: number
  public positionHistorySize: number

  constructor(
    initialEnableMousePrediction: boolean,
    initialTrajectoryPredictionTime: number,
    initialPositionHistorySize: number,
    elements: ReadonlyMap<ForesightElement, ForesightElementData>,
    callCallback: CallCallbackFunction,
    emit: EmitFunction
  ) {
    super(elements, callCallback, emit)
    this.enableMousePrediction = initialEnableMousePrediction
    this.trajectoryPredictionTime = initialTrajectoryPredictionTime
    this.positionHistorySize = initialPositionHistorySize
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
        this.pendingMouseEvent = null
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
        this.positionHistorySize,
        this.trajectoryPredictionTime
      )
    } else {
      this.trajectoryPositions.predictedPoint = currentPoint
    }
  }

  public cleanup(): void {
    super.abort()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.pendingMouseEvent = null
  }
  private processMouseMovement(e: MouseEvent) {
    this.updatePointerState(e)

    // Use for...of instead of forEach for better performance in hot code path
    // Avoids function call overhead and iterator creation on every mouse move
    for (const currentData of this.elements.values()) {
      if (!currentData.isIntersectingWithViewport) {
        continue
      }
      const expandedRect = currentData.elementBounds.expandedRect

      if (!this.enableMousePrediction) {
        if (isPointInRectangle(this.trajectoryPositions.currentPoint, expandedRect)) {
          this.callbackFunction(currentData, { kind: "mouse", subType: "hover" })
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
        this.callbackFunction(currentData, { kind: "mouse", subType: "trajectory" })
      }
    }

    this.emit({
      type: "mouseTrajectoryUpdate",
      predictionEnabled: this.enableMousePrediction,
      trajectoryPositions: this.trajectoryPositions,
    })
  }
}
