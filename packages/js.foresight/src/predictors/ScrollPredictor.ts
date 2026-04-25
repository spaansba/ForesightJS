import { getScrollDirection } from "../helpers/getScrollDirection"
import { lineSegmentIntersectsRect } from "../helpers/lineSegmentIntersectsRect"
import { predictNextScrollPosition } from "../helpers/predictNextScrollPosition"
import type {
  ForesightElementInternal,
  Point,
  ScrollDirection,
  ScrollTrajectoryUpdateEvent,
  TrajectoryPositions,
} from "../types/types"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"

export interface ScrollPredictorConfig {
  dependencies: ForesightModuleDependencies
  trajectoryPositions: Readonly<TrajectoryPositions>
}

export class ScrollPredictor extends BaseForesightModule {
  protected readonly moduleName = "ScrollPredictor"

  private predictedScrollPoint: Point | null = null
  private scrollDirection: ScrollDirection | null = null
  private trajectoryPositions: Readonly<TrajectoryPositions>

  // Pre-allocated event object to avoid creating a new object every scroll frame
  private readonly scrollTrajectoryEvent: ScrollTrajectoryUpdateEvent

  constructor(config: ScrollPredictorConfig) {
    super(config.dependencies)
    this.trajectoryPositions = config.trajectoryPositions
    this.scrollTrajectoryEvent = {
      type: "scrollTrajectoryUpdate",
      currentPoint: this.trajectoryPositions.currentPoint,
      predictedPoint: { x: 0, y: 0 },
      scrollDirection: "none",
    }
  }

  public resetScrollProps(): void {
    this.scrollDirection = null
    this.predictedScrollPoint = null
  }

  public handleScrollPrefetch(internal: ForesightElementInternal, newRect: DOMRect): void {
    const state = internal.state
    if (!state.isIntersectingWithViewport || state.isPredicted || !state.isActive) {
      return
    }

    // ONCE per handlePositionChange batch we decide what the scroll direction is
    this.scrollDirection =
      this.scrollDirection ?? getScrollDirection(state.elementBounds.originalRect, newRect)

    if (this.scrollDirection === "none") {
      return
    }

    // ONCE per handlePositionChange batch we decide the predicted scroll point
    this.predictedScrollPoint =
      this.predictedScrollPoint ??
      predictNextScrollPosition(
        this.trajectoryPositions.currentPoint,
        this.scrollDirection,
        this.settings.scrollMargin
      )

    // Check if the scroll is going to intersect with an registered element
    if (
      lineSegmentIntersectsRect(
        this.trajectoryPositions.currentPoint,
        this.predictedScrollPoint,
        state.elementBounds.expandedRect
      )
    ) {
      this.callCallback(internal, {
        kind: "scroll",
        subType: this.scrollDirection,
      })
    }

    if (this.hasListeners("scrollTrajectoryUpdate")) {
      this.scrollTrajectoryEvent.predictedPoint = this.predictedScrollPoint
      this.scrollTrajectoryEvent.scrollDirection = this.scrollDirection
      this.emit(this.scrollTrajectoryEvent)
    }
  }

  protected onConnect() {}
  protected onDisconnect = () => this.resetScrollProps()
}
