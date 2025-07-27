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
  private mousePredictor: MousePredictor
  private tabPredictor: TabPredictor
  private scrollPredictor: ScrollPredictor
  private positionObserver: PositionObserver | null = null
  public trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer(DEFAULT_POSITION_HISTORY_SIZE),
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  constructor(config: PredictorDependencies) {
    super(config)
    this.tabPredictor = new TabPredictor(config)
    this.scrollPredictor = new ScrollPredictor({
      dependencies: config,
      trajectoryPositions: this.trajectoryPositions,
    })
    this.mousePredictor = new MousePredictor({
      dependencies: config,
      trajectoryPositions: this.trajectoryPositions,
    })
  }

  public invalidateTabCache(): void {
    this.tabPredictor?.invalidateCache()
  }

  public processMouseMovement(event: PointerEvent): void {
    this.mousePredictor.processMouseMovement(event)
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
    this.tabPredictor.connect()
  }

  public connectScrollPredictor(): void {
    this.scrollPredictor.connect()
  }

  public connectMousePredictor(): void {
    this.mousePredictor.connect()
  }

  public disconnectTabPredictor(): void {
    this.tabPredictor.disconnect()
  }
  public disconnectScrollPredictor(): void {
    this.scrollPredictor.disconnect()
  }
  public disconnectMousePredictor(): void {
    this.mousePredictor.disconnect()
  }

  private handlePositionChange = (entries: PositionObserverEntry[]) => {
    const enableScrollPosition = this.settings.enableScrollPrediction
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
