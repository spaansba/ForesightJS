import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ElementObservingModule } from "../core/ElementObservingModule"
import { MousePredictor } from "../predictors/MousePredictor"
import type { ScrollPredictor } from "../predictors/ScrollPredictor"
import type { TabPredictor } from "../predictors/TabPredictor"
import { PositionObserver, PositionObserverEntry } from "position-observer"
import type {
  ForesightElement,
  ForesightElementInternal,
  ForesightElementState,
  TrajectoryPositions,
  UpdatedDataPropertyNames,
} from "../types/types"
import { CircularBuffer } from "../helpers/CircularBuffer"
import { DEFAULT_POSITION_HISTORY_SIZE } from "../constants"
import { areRectsEqual, getExpandedRect, isPointInRectangle } from "../helpers/rectAndHitSlop"

export class DesktopHandler extends ElementObservingModule {
  protected readonly moduleName = "DesktopHandler"

  private mousePredictor: MousePredictor
  private tabPredictor: TabPredictor | null = null
  private scrollPredictor: ScrollPredictor | null = null
  private positionObserver: PositionObserver | null = null
  private storedDependencies: ForesightModuleDependencies

  public trajectoryPositions: TrajectoryPositions = {
    positions: new CircularBuffer(DEFAULT_POSITION_HISTORY_SIZE),
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
    this.storedDependencies = dependencies

    // Only MousePredictor is instantiated immediately - Tab and Scroll are lazy-loaded
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

    if (this.settings.enableTabPrediction) {
      enabledPredictors.push("tab (loading...)")
    }

    if (this.settings.enableScrollPrediction) {
      enabledPredictors.push("scroll (loading...)")
    }

    this.devLog(`Connected predictors: [${enabledPredictors.join(", ")}] and PositionObserver`)

    for (const element of this.elements.keys()) {
      this.positionObserver.observe(element)
    }
  }

  private handlePositionChange = (entries: PositionObserverEntry[]) => {
    const enableScrollPosition = this.settings.enableScrollPrediction

    for (const positionEntry of entries) {
      const entry = this.elements.get(positionEntry.target)

      if (!entry) {
        continue
      }

      if (enableScrollPosition) {
        this.scrollPredictor?.handleScrollPrefetch(entry, positionEntry.boundingClientRect)
      } else {
        // If we dont check for scroll prediction, check if the user is hovering over the element during a scroll instead
        this.checkForMouseHover(entry)
      }

      // Must run AFTER handleScrollPrefetch — scroll direction is derived from
      // the difference between the old and new originalRect.
      this.handlePositionChangeDataUpdates(entry, positionEntry)
    }

    if (enableScrollPosition) {
      this.scrollPredictor?.resetScrollProps()
    }
  }

  private checkForMouseHover = (entry: ForesightElementInternal) => {
    if (
      isPointInRectangle(
        this.trajectoryPositions.currentPoint,
        entry.state.elementBounds.expandedRect
      )
    ) {
      this.callCallback(entry, {
        kind: "mouse",
        subType: "hover",
      })
    }
  }

  private handlePositionChangeDataUpdates = (
    entry: ForesightElementInternal,
    positionEntry: PositionObserverEntry
  ) => {
    const updatedProps: UpdatedDataPropertyNames[] = []
    const isNowIntersecting = positionEntry.isIntersecting
    const state = entry.state
    const patch: Partial<ForesightElementState> = {}

    if (state.isIntersectingWithViewport !== isNowIntersecting) {
      updatedProps.push("visibility")
      patch.isIntersectingWithViewport = isNowIntersecting
    }

    if (
      isNowIntersecting &&
      !areRectsEqual(positionEntry.boundingClientRect, state.elementBounds.originalRect)
    ) {
      updatedProps.push("bounds")
      patch.elementBounds = {
        hitSlop: state.elementBounds.hitSlop,
        originalRect: positionEntry.boundingClientRect,
        expandedRect: getExpandedRect(
          positionEntry.boundingClientRect,
          state.elementBounds.hitSlop
        ),
      }
    }

    if (updatedProps.length === 0) {
      return
    }

    const next = this.updateElementState(entry, patch)

    if (this.hasListeners("elementDataUpdated")) {
      this.emit({
        type: "elementDataUpdated",
        element: entry.element,
        state: next,
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

  public observeElement(element: ForesightElement): void {
    this.positionObserver?.observe(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.positionObserver?.unobserve(element)
  }

  public connectTabPredictor = async () => {
    if (!this.tabPredictor) {
      const { TabPredictor } = await import("../predictors/TabPredictor")
      this.tabPredictor = new TabPredictor(this.storedDependencies)
      this.devLog("TabPredictor lazy loaded")
    }

    this.tabPredictor.connect()
  }

  public connectScrollPredictor = async () => {
    if (!this.scrollPredictor) {
      const { ScrollPredictor } = await import("../predictors/ScrollPredictor")
      this.scrollPredictor = new ScrollPredictor({
        dependencies: this.storedDependencies,
        trajectoryPositions: this.trajectoryPositions,
      })

      this.devLog("ScrollPredictor lazy loaded")
    }

    this.scrollPredictor.connect()
  }

  public connectMousePredictor = () => this.mousePredictor.connect()

  public disconnectTabPredictor = () => this.tabPredictor?.disconnect()
  public disconnectScrollPredictor = () => this.scrollPredictor?.disconnect()
  public disconnectMousePredictor = () => this.mousePredictor.disconnect()

  /** For debugging: returns which predictors have been lazy loaded */
  public get loadedPredictors() {
    return {
      mouse: this.mousePredictor !== null,
      tab: this.tabPredictor !== null,
      scroll: this.scrollPredictor !== null,
    }
  }
}
