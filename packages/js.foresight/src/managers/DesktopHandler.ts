import { getExpandedRect, isPointInRectangle } from "js.foresight/helpers/rectAndHitSlop"
import type { PredictorDependencies } from "js.foresight/predictors/BasePredictor"
import { MousePredictor } from "js.foresight/predictors/MousePredictor"
import { ScrollPredictor } from "js.foresight/predictors/ScrollPredictor"
import { TabPredictor } from "js.foresight/predictors/TabPredictor"
import { PositionObserver, PositionObserverEntry } from "position-observer"
import { BaseHandler } from "./BaseHandler"
import type {
  ForesightElement,
  ForesightElementData,
  TrajectoryPositions,
  UpdatedDataPropertyNames,
} from "js.foresight/types/types"
import { CircularBuffer } from "js.foresight/helpers/CircularBuffer"
import { DEFAULT_POSITION_HISTORY_SIZE } from "js.foresight/constants"

export class DesktopHandler extends BaseHandler {
  private mousePredictor: MousePredictor | null = null
  private tabPredictor: TabPredictor | null = null
  private scrollPredictor: ScrollPredictor | null = null
  private positionObserver: PositionObserver | null = null
  public trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer(DEFAULT_POSITION_HISTORY_SIZE),
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }
  public enableScrollPrediction: boolean = true
  constructor(config: PredictorDependencies) {
    super(config)
  }

  public invalidateTabCache(): void {
    this.tabPredictor?.invalidateCache()
  }

  public connect(): void {
    this.connectTabPredictor()
    this.connectScrollPredictor()
    this.connectMousePredictor()
    this.positionObserver = new PositionObserver(this.handlePositionChange)
    for (const element of this.elements.keys()) {
      this.positionObserver.observe(element)
    }
  }

  public disconnect(): void {
    this.disconnectMousePredictor()
    this.disconnectTabPredictor()
    this.disconnectScrollPredictor()
    this.positionObserver?.disconnect()
    this.positionObserver = null
  }

  public observeElement(element: ForesightElement): void {
    this.positionObserver?.observe(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.positionObserver?.unobserve(element)
  }

  public connectTabPredictor(): void {
    if (this.settings.enableTabPrediction && !this.tabPredictor) {
      this.tabPredictor = new TabPredictor({
        dependencies: {
          elements: this.elements,
          callCallback: this.callCallback,
          emit: this.emit,
        },
        settings: {
          tabOffset: this.settings.tabOffset,
        },
      })
    }
  }

  public connectScrollPredictor(): void {
    if (this.settings.enableScrollPrediction && !this.scrollPredictor) {
      this.scrollPredictor = new ScrollPredictor({
        dependencies: {
          elements: this.elements,
          callCallback: this.callCallback,
          emit: this.emit,
        },
        settings: {
          scrollMargin: this.settings.scrollMargin,
        },
        trajectoryPositions: this.trajectoryPositions,
      })
    }
  }

  public connectMousePredictor(): void {
    if (this.settings.enableMousePrediction && !this.mousePredictor) {
      this.mousePredictor = new MousePredictor({
        dependencies: {
          elements: this.elements,
          callCallback: this.callCallback,
          emit: this.emit,
        },
        settings: {
          trajectoryPredictionTime: this.settings.trajectoryPredictionTime,
          positionHistorySize: this.settings.positionHistorySize,
          enableMousePrediction: this.settings.enableMousePrediction,
        },
        trajectoryPositions: this.trajectoryPositions,
      })
    }
  }

  public disconnectTabPredictor(): void {
    this.tabPredictor?.cleanup()
  }
  public disconnectScrollPredictor(): void {
    this.scrollPredictor?.cleanup()
  }
  public disconnectMousePredictor(): void {
    this.mousePredictor?.cleanup()
  }

  private handlePositionChange = (entries: PositionObserverEntry[]) => {
    const enableScrollPosition = this.enableScrollPrediction
    for (const entry of entries) {
      const elementData = this.elements.get(entry.target)
      if (!elementData) {
        continue
      }
      if (enableScrollPosition) {
        this.scrollPredictor?.handleScrollPrefetch(elementData, entry.boundingClientRect)
      } else {
        // If we dont check for scroll prediction, check if the user is hovering over the element during a scroll instead
        if (
          isPointInRectangle(
            this.trajectoryPositions.currentPoint,
            elementData.elementBounds.expandedRect
          )
        ) {
          this.callCallback(elementData, {
            kind: "mouse",
            subType: "hover",
          })
        }
      }
      // Always call handlePositionChangeDataUpdates AFTER handleScrollPrefetch since handlePositionChangeDataUpdates alters the elementData
      this.handlePositionChangeDataUpdates(elementData, entry)
    }

    // End batch processing for scroll prediction
    if (enableScrollPosition) {
      this.scrollPredictor?.resetScrollProps()
    }
  }
  private handlePositionChangeDataUpdates = (
    elementData: ForesightElementData,
    entry: PositionObserverEntry
  ) => {
    const updatedProps: UpdatedDataPropertyNames[] = []
    const isNowIntersecting = entry.isIntersecting

    // Track visibility changes
    if (elementData.isIntersectingWithViewport !== isNowIntersecting) {
      updatedProps.push("visibility")
      elementData.isIntersectingWithViewport = isNowIntersecting
    }

    // Handle bounds updates for intersecting elements
    if (isNowIntersecting) {
      updatedProps.push("bounds")
      elementData.elementBounds = {
        hitSlop: elementData.elementBounds.hitSlop,
        originalRect: entry.boundingClientRect,
        expandedRect: getExpandedRect(entry.boundingClientRect, elementData.elementBounds.hitSlop),
      }
    }
    if (updatedProps.length) {
      this.emit({
        type: "elementDataUpdated",
        elementData: elementData,
        updatedProps,
      })
    }
  }
}
