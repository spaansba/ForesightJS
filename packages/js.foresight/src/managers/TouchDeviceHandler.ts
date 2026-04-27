import type { ForesightElement } from "../types/types"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ElementObservingModule } from "../core/ElementObservingModule"
import type { ViewportPredictor } from "../predictors/ViewportPredictor"
import type { TouchStartPredictor } from "../predictors/TouchStartPredictor"

export class TouchDeviceHandler extends ElementObservingModule {
  protected readonly moduleName = "TouchDeviceHandler"

  private viewportPredictor: ViewportPredictor | null = null
  private touchStartPredictor: TouchStartPredictor | null = null
  private predictor: ElementObservingModule | null = null
  private storedDependencies: ForesightModuleDependencies

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
    this.storedDependencies = dependencies
  }

  private async getOrCreateViewportPredictor(): Promise<ViewportPredictor> {
    if (!this.viewportPredictor) {
      const { ViewportPredictor } = await import("../predictors/ViewportPredictor")
      this.viewportPredictor = new ViewportPredictor(this.storedDependencies)
      this.devLog("ViewportPredictor lazy loaded")
    }

    return this.viewportPredictor
  }

  private async getOrCreateTouchStartPredictor(): Promise<TouchStartPredictor> {
    if (!this.touchStartPredictor) {
      const { TouchStartPredictor } = await import("../predictors/TouchStartPredictor")
      this.touchStartPredictor = new TouchStartPredictor(this.storedDependencies)
      this.devLog("TouchStartPredictor lazy loaded")
    }

    return this.touchStartPredictor
  }

  public async setTouchPredictor() {
    this.predictor?.disconnect()

    switch (this.settings.touchDeviceStrategy) {
      case "viewport":
        this.predictor = await this.getOrCreateViewportPredictor()
        this.devLog(
          `Connected touch strategy: ${this.settings.touchDeviceStrategy} (ViewportPredictor)`
        )
        break
      case "onTouchStart":
        this.predictor = await this.getOrCreateTouchStartPredictor()
        this.devLog(
          `Connected touch strategy: ${this.settings.touchDeviceStrategy} (TouchStartPredictor)`
        )
        break
      case "none":
        this.predictor = null
        this.devLog(`Touch strategy set to "none" - no predictor connected`)

        return
      default:
        this.settings.touchDeviceStrategy satisfies never
    }

    this.predictor?.connect()

    for (const element of this.elements.keys()) {
      this.predictor?.observeElement(element)
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
