import type {
  ForesightElementData,
  Point,
  ScrollDirection,
  TrajectoryPositions,
} from "../types/types"
import { BasePredictor, type BasePredictorConfig } from "./BasePredictor"
import { getScrollDirection } from "../helpers/getScrollDirection"
import { predictNextScrollPosition } from "../helpers/predictNextScrollPosition"
import { lineSegmentIntersectsRect } from "../helpers/lineSigmentIntersectsRect"

export interface ScrollPredictorSettings {
  scrollMargin: number
}

export interface ScrollPredictorConfig extends BasePredictorConfig {
  settings: ScrollPredictorSettings
  trajectoryPositions: Readonly<TrajectoryPositions>
}

export class ScrollPredictor extends BasePredictor {
  protected initializeListeners(): void {
    // ScrollPredictor doesn't need direct event listeners
    // as it's called by the ForesightManager during position changes
  }

  private predictedScrollPoint: Point | null = null
  private scrollDirection: ScrollDirection | null = null
  public scrollMargin: number
  private trajectoryPositions: Readonly<TrajectoryPositions>

  constructor(config: ScrollPredictorConfig) {
    super(config)
    this.scrollMargin = config.settings.scrollMargin
    this.trajectoryPositions = config.trajectoryPositions
  }

  public cleanup(): void {
    this.abort()
    this.resetScrollProps()
  }

  public resetScrollProps(): void {
    this.scrollDirection = null
    this.predictedScrollPoint = null
  }

  public handleScrollPrefetch(elementData: ForesightElementData, newRect: DOMRect): void {
    if (!elementData.isIntersectingWithViewport) {
      return
    }

    try {
      // ONCE per handlePositionChange batch we decide what the scroll direction is
      this.scrollDirection =
        this.scrollDirection ?? getScrollDirection(elementData.elementBounds.originalRect, newRect)

      if (this.scrollDirection === "none") {
        return
      }

      // ONCE per handlePositionChange batch we decide the predicted scroll point
      this.predictedScrollPoint =
        this.predictedScrollPoint ??
        predictNextScrollPosition(
          this.trajectoryPositions.currentPoint,
          this.scrollDirection,
          this.scrollMargin
        )

      // Check if the scroll is going to intersect with an registered element
      if (
        lineSegmentIntersectsRect(
          this.trajectoryPositions.currentPoint,
          this.predictedScrollPoint,
          elementData.elementBounds.expandedRect
        )
      ) {
        this.callCallback(elementData, {
          kind: "scroll",
          subType: this.scrollDirection,
        })
      }

      this.emit({
        type: "scrollTrajectoryUpdate",
        currentPoint: this.trajectoryPositions.currentPoint,
        predictedPoint: this.predictedScrollPoint,
        scrollDirection: this.scrollDirection,
      })
    } catch (error) {
      this.handleError(error, "handleScrollPrefetch")
    }
  }

  protected handleError(error: unknown, context: string): void {
    super.handleError(error, context)

    // Emit fallback event on error
    this.emit({
      type: "scrollTrajectoryUpdate",
      currentPoint: this.trajectoryPositions.currentPoint,
      predictedPoint: this.trajectoryPositions.currentPoint,
      scrollDirection: "none",
    })
  }
}
