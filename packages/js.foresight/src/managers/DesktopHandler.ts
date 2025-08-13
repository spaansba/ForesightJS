import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import { MousePredictor } from "../predictors/MousePredictor"
import { ScrollPredictor } from "../predictors/ScrollPredictor"
import { TabPredictor } from "../predictors/TabPredictor"
import { PositionObserver, PositionObserverEntry } from "position-observer"
import type {
  ForesightElement,
  ForesightElementData,
  TrajectoryPositions,
  UpdatedDataPropertyNames,
} from "../types/types"
import { CircularBuffer } from "../helpers/CircularBuffer"
import { DEFAULT_POSITION_HISTORY_SIZE } from "../constants"
import { getExpandedRect, isPointInRectangle } from "../helpers/rectAndHitSlop"

export class DesktopHandler extends BaseForesightModule {
  protected readonly moduleName = "DesktopHandler"

  private mousePredictor: MousePredictor
  private tabPredictor: TabPredictor
  private scrollPredictor: ScrollPredictor
  private positionObserver: PositionObserver | null = null

  public trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer(DEFAULT_POSITION_HISTORY_SIZE),
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)

    this.tabPredictor = new TabPredictor(dependencies)

    this.scrollPredictor = new ScrollPredictor({
      dependencies,
      trajectoryPositions: this.trajectoryPositions,
    })

    this.mousePredictor = new MousePredictor({
      dependencies,
      trajectoryPositions: this.trajectoryPositions,
    })
  }

  protected onConnect(): void {
    if (this.settings.enableTabPrediction) {
      this.connectTabPredictor()
    }

    if (this.settings.enableScrollPrediction) {
      this.connectScrollPredictor()
    }

    this.connectMousePredictor() // We always connect the mouse predictor
    this.positionObserver = new PositionObserver(this.handlePositionChange)

    const enabledPredictors = ["mouse"]
    if (this.settings.enableTabPrediction) enabledPredictors.push("tab")
    if (this.settings.enableScrollPrediction) enabledPredictors.push("scroll")
    this.devLog(`Connected predictors: [${enabledPredictors.join(", ")}] and PositionObserver`)

    for (const element of this.elements.keys()) {
      this.positionObserver.observe(element)
    }
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
        this.checkForMouseHover(elementData)
      }

      // Always call handlePositionChangeDataUpdates AFTER handleScrollPrefetch since handlePositionChangeDataUpdates alters the elementData
      this.handlePositionChangeDataUpdates(elementData, entry)
    }

    if (enableScrollPosition) {
      this.scrollPredictor?.resetScrollProps()
    }
  }

  private checkForMouseHover = (elementData: ForesightElementData) => {
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

  private handlePositionChangeDataUpdates = (
    elementData: ForesightElementData,
    entry: PositionObserverEntry
  ) => {
    const updatedProps: UpdatedDataPropertyNames[] = []
    const isNowIntersecting = entry.isIntersecting

    if (elementData.isIntersectingWithViewport !== isNowIntersecting) {
      updatedProps.push("visibility")
      elementData.isIntersectingWithViewport = isNowIntersecting
    }

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

  protected onDisconnect(): void {
    this.disconnectMousePredictor()
    this.disconnectTabPredictor()
    this.disconnectScrollPredictor()
    this.positionObserver?.disconnect()
    this.positionObserver = null
  }

  public processMouseMovement = (event: PointerEvent) =>
    this.mousePredictor.processMouseMovement(event)

  public invalidateTabCache = () => this.tabPredictor?.invalidateCache()

  public observeElement = (element: ForesightElement) => this.positionObserver?.observe(element)
  public unobserveElement = (element: ForesightElement) => this.positionObserver?.unobserve(element)

  public connectTabPredictor = () => this.tabPredictor.connect()
  public connectScrollPredictor = () => this.scrollPredictor.connect()
  public connectMousePredictor = () => this.mousePredictor.connect()

  public disconnectTabPredictor = () => this.tabPredictor.disconnect()
  public disconnectScrollPredictor = () => this.scrollPredictor.disconnect()
  public disconnectMousePredictor = () => this.mousePredictor.disconnect()
}
