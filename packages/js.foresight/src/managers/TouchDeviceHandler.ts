import type { ForesightElement, ForesightManagerSettings } from "../types/types"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ElementObservingModule } from "../core/ElementObservingModule"
import type { ViewportPredictor } from "../predictors/ViewportPredictor"
import type { TouchStartPredictor } from "../predictors/TouchStartPredictor"

export class TouchDeviceHandler extends ElementObservingModule {
  protected readonly moduleName = "TouchDeviceHandler"

  private viewportPredictor: ViewportPredictor | null = null
  private touchStartPredictor: TouchStartPredictor | null = null
  private predictor: ElementObservingModule | null = null
  /** Bumped per strategy change so a stale lazy load never connects. */
  private predictorRequest = 0
  private storedDependencies: ForesightModuleDependencies

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
    this.storedDependencies = dependencies
  }

  private async getOrCreateViewportPredictor(): Promise<ViewportPredictor> {
    if (!this.viewportPredictor) {
      const { ViewportPredictor } = await import("../predictors/ViewportPredictor")
      this.viewportPredictor ??= new ViewportPredictor(this.storedDependencies)
      this.devLog("ViewportPredictor lazy loaded")
    }

    return this.viewportPredictor
  }

  private async getOrCreateTouchStartPredictor(): Promise<TouchStartPredictor> {
    if (!this.touchStartPredictor) {
      const { TouchStartPredictor } = await import("../predictors/TouchStartPredictor")
      this.touchStartPredictor ??= new TouchStartPredictor(this.storedDependencies)
      this.devLog("TouchStartPredictor lazy loaded")
    }

    return this.touchStartPredictor
  }

  public onSettingsChanged(changed: ReadonlySet<keyof ForesightManagerSettings>): void {
    if (changed.has("touchDeviceStrategy") && this.isConnected) {
      this.setTouchPredictor()
    }
  }

  public async setTouchPredictor() {
    const request = ++this.predictorRequest
    const strategy = this.settings.touchDeviceStrategy
    this.predictor?.disconnect()

    let predictor: ElementObservingModule | null = null
    switch (strategy) {
      case "viewport":
        predictor = await this.getOrCreateViewportPredictor()
        break
      case "onTouchStart":
        predictor = await this.getOrCreateTouchStartPredictor()
        break
      case "none":
        break
      default:
        strategy satisfies never
    }

    // A newer strategy change or a disconnect happened while the predictor was loading.
    if (request !== this.predictorRequest || !this.isConnected) {
      return
    }

    this.predictor = predictor
    this.devLog(`Connected touch strategy: ${strategy}`)

    if (!predictor) {
      return
    }

    predictor.connect()

    for (const [element, entry] of this.elements) {
      if (entry.state.isActive) {
        predictor.observeElement(element)
      }
    }
  }

  protected onDisconnect = () => {
    this.devLog("Disconnecting touch predictor")
    this.predictor?.disconnect()
  }
  protected onConnect = () => this.setTouchPredictor()

  public observeElement(element: ForesightElement): void {
    this.predictor?.observeElement(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.predictor?.unobserveElement(element)
  }

  /** For debugging: returns which predictors have been lazy loaded */
  public get loadedPredictors() {
    return {
      viewport: this.viewportPredictor !== null,
      touchStart: this.touchStartPredictor !== null,
    }
  }
}
