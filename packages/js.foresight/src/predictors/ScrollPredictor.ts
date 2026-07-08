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

interface ScrollPredictorConfig {
  dependencies: ForesightModuleDependencies
  trajectoryPositions: Readonly<TrajectoryPositions>
}

export class ScrollPredictor extends BaseForesightModule {
  protected readonly moduleName = "ScrollPredictor"

  // Reused across the batch to avoid allocating a point per scroll change
  private readonly predictedScrollPoint: Point = { x: 0, y: 0 }
  private hasPredictedScrollPoint = false
  private scrollDirection: Exclude<ScrollDirection, "none"> | null = null
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
    this.hasPredictedScrollPoint = false
  }

  public handleScrollPrefetch(entry: ForesightElementInternal, newRect: DOMRect): void {
    const state = entry.state
    if (!state.isIntersectingWithViewport || state.isPredicted || !state.isActive) {
      return
    }

    // ONCE per handlePositionChange batch we lock in a real scroll direction.
    // A "none" element (e.g. position:fixed) does not move, so we must keep
    // probing later elements instead of caching "none" for the whole batch.
    // entry.bounds still holds the PRE-scroll rect here - the DesktopHandler only
    // updates bounds after this runs (see handlePositionChange ordering).
    if (!this.scrollDirection) {
      const direction = getScrollDirection(entry.bounds.originalRect, newRect)
      if (direction === "none") {
        return
      }

      this.scrollDirection = direction
    }

    // ONCE per handlePositionChange batch we decide the predicted scroll point
    if (!this.hasPredictedScrollPoint) {
      predictNextScrollPosition(
        this.trajectoryPositions.currentPoint,
        this.scrollDirection,
        this.settings.scrollMargin,
        this.predictedScrollPoint
      )
      this.hasPredictedScrollPoint = true
    }

    // Check if the scroll is going to intersect with an registered element
    if (
      lineSegmentIntersectsRect(
        this.trajectoryPositions.currentPoint,
        this.predictedScrollPoint,
        entry.bounds.expandedRect
      )
    ) {
      this.callCallback(entry, {
        kind: "scroll",
        subType: this.scrollDirection,
      })
    }
  }

  /**
   * Emits a single trajectory update for the whole position-change batch;
   * direction and predicted point are identical for every element in it.
   * Called by the DesktopHandler after the batch, before resetScrollProps.
   */
  public emitTrajectoryUpdate(): void {
    if (
      !this.scrollDirection ||
      !this.hasPredictedScrollPoint ||
      !this.hasListeners("scrollTrajectoryUpdate")
    ) {
      return
    }

    this.scrollTrajectoryEvent.predictedPoint = this.predictedScrollPoint
    this.scrollTrajectoryEvent.scrollDirection = this.scrollDirection
    this.emit(this.scrollTrajectoryEvent)
  }

  protected onConnect() {}
  protected onDisconnect = () => this.resetScrollProps()
}
