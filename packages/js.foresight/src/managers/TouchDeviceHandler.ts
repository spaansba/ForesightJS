import type { ForesightElement } from "../types/types"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ViewportPredictor } from "../predictors/ViewportPredictor"
import { TouchStartPredictor } from "../predictors/TouchStartPredictor"

export class TouchDeviceHandler extends BaseForesightModule {
  protected readonly moduleName = "TouchDeviceHandler"
  
  private viewportPredictor: ViewportPredictor
  private touchStartPredictor: TouchStartPredictor
  private predictor: ViewportPredictor | TouchStartPredictor

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
    this.viewportPredictor = new ViewportPredictor(dependencies)
    this.touchStartPredictor = new TouchStartPredictor(dependencies)
    this.predictor = this.viewportPredictor
  }

  public setTouchPredictor() {
    this.predictor.disconnect()
    if (this.settings.touchDeviceStrategy === "viewport") {
      this.predictor = this.viewportPredictor
    } else if (this.settings.touchDeviceStrategy === "onTouchStart") {
      this.predictor = this.touchStartPredictor
    }
    this.predictor.connect()
    for (const element of this.elements.keys()) {
      this.predictor.observeElement(element)
    }
  }

  protected onDisconnect(): void {
    this.predictor.disconnect()
  }

  protected onConnect(): void {
    this.setTouchPredictor()
  }

  public observeElement(element: ForesightElement): void {
    this.predictor.observeElement(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.predictor.unobserveElement(element)
  }
}
