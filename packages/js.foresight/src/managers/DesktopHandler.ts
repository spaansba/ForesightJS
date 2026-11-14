import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import { MousePredictor } from "../predictors/MousePredictor"
import { ScrollPredictor } from "../predictors/ScrollPredictor"
import type { TabPredictor } from "../predictors/TabPredictor"
import {
  createPositionObserver,
  type PositionEntry,
  type PositionObserver,
} from "../helpers/createPositionObserver"
import type {
  ForesightElement,
  ForesightElementInternal,
  ForesightManagerSettings,
  TrajectoryPositions,
} from "../types/types"
import { areRectsEqual, getExpandedRect, isPointInRectangle } from "../helpers/rectAndHitSlop"

export class DesktopHandler extends BaseForesightModule {
  private mousePredictor: MousePredictor
  private tabPredictor: TabPredictor | null = null
  private scrollPredictor: ScrollPredictor
  private positionObserver: PositionObserver | null = null

  public trajectoryPositions: TrajectoryPositions = {
    currentPoint: { x: 0, y: 0 },
    predictedPoint: { x: 0, y: 0 },
  }

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)

    const config = { dependencies, trajectoryPositions: this.trajectoryPositions }
    this.mousePredictor = new MousePredictor(config)
    this.scrollPredictor = new ScrollPredictor(config)
  }

  protected onConnect(): void {
    if (this.deps.settings.enableTabPrediction) {
      this.connectTabPredictor()
    }

    this.positionObserver = createPositionObserver(this.handlePositionChange)

    for (const [element, entry] of this.deps.elements) {
      if (entry.state.isActive) {
        this.positionObserver.observe(element)
      }
    }
  }

  private handlePositionChange = (entries: PositionEntry[]) => {
    const enableScrollPosition = this.deps.settings.enableScrollPrediction

    for (const positionEntry of entries) {
      const entry = this.deps.elements.get(positionEntry.target)

      if (!entry) {
        continue
      }

      if (enableScrollPosition) {
        this.scrollPredictor.handleScrollPrefetch(entry, positionEntry.boundingClientRect)
      } else {
        // If we dont check for scroll prediction, check if the user is hovering over the element during a scroll instead
        this.checkForMouseHover(entry)
      }

      // Must run AFTER handleScrollPrefetch/checkForMouseHover - scroll
      // direction is derived from the difference between the old and new
      // originalRect, so entry.bounds must not be updated before they read it.
      this.handlePositionChangeDataUpdates(entry, positionEntry)
    }

    if (enableScrollPosition) {
      this.scrollPredictor.emitTrajectoryUpdate()
      this.scrollPredictor.resetScrollProps()
    }
  }

  private checkForMouseHover = (entry: ForesightElementInternal) => {
    if (isPointInRectangle(this.trajectoryPositions.currentPoint, entry.bounds.expandedRect)) {
      this.deps.callCallback(entry, {
        kind: "mouse",
        subType: "hover",
      })
    }
  }

  private handlePositionChangeDataUpdates = (
    entry: ForesightElementInternal,
    positionEntry: PositionEntry
  ) => {
    const isNowIntersecting = positionEntry.isIntersecting

    // Bounds are updated BEFORE the state patch so state subscribers always
    // read fresh geometry.
    if (
      isNowIntersecting &&
      !areRectsEqual(positionEntry.boundingClientRect, entry.bounds.originalRect)
    ) {
      this.deps.updateElementBounds(entry, {
        originalRect: positionEntry.boundingClientRect,
        expandedRect: getExpandedRect(positionEntry.boundingClientRect, entry.state.hitSlop),
      })
    }

    if (entry.state.isIntersectingWithViewport !== isNowIntersecting) {
      this.deps.updateElementState(entry, { isIntersectingWithViewport: isNowIntersecting })
    }
  }

  protected onDisconnect(): void {
    this.tabPredictor?.disconnect()
    this.positionObserver?.disconnect()
    this.positionObserver = null
  }

  public onSettingsChanged(changed: ReadonlySet<keyof ForesightManagerSettings>): void {
    if (!this.isConnected || !changed.has("enableTabPrediction")) {
      return
    }

    if (this.deps.settings.enableTabPrediction) {
      this.connectTabPredictor()
    } else {
      this.tabPredictor?.disconnect()
    }
  }

  private async connectTabPredictor(): Promise<void> {
    if (!this.tabPredictor) {
      const { TabPredictor } = await import("../predictors/TabPredictor")
      this.tabPredictor ??= new TabPredictor(this.deps)
    }

    // The handler may have disconnected, or the setting flipped off, while the dynamic import was resolving.
    if (this.isConnected && this.deps.settings.enableTabPrediction) {
      this.tabPredictor.connect()
    }
  }

  public invalidateTabCache = () => this.tabPredictor?.invalidateCache()

  public processMouseMovement = (event: PointerEvent) =>
    this.mousePredictor.processMouseMovement(event)

  public observeElement(element: ForesightElement): void {
    this.positionObserver?.observe(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.positionObserver?.unobserve(element)
  }
}
