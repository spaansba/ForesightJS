import type { ForesightElement } from "../types/types"
import { type PredictorDependencies } from "../predictors/BasePredictor"
import { BaseHandler } from "./BaseHandler"
import { ViewportPredictor } from "../predictors/ViewportPredictor"
import { TouchStartPredictor } from "../predictors/TouchStartPredictor"

export class TouchDeviceHandler extends BaseHandler {
  private viewportPredictor: ViewportPredictor
  private touchStartPredictor: TouchStartPredictor
  private predictor: ViewportPredictor | TouchStartPredictor

  constructor(config: PredictorDependencies) {
    super(config)
    this.viewportPredictor = new ViewportPredictor(config)
    this.touchStartPredictor = new TouchStartPredictor(config)
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

  public disconnect(): void {
    this.viewportPredictor.disconnect()
    this.touchStartPredictor.disconnect()
  }

  public connect(): void {
    this.setTouchPredictor()
  }

  public observeElement(element: ForesightElement): void {
    this.predictor.observeElement(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.predictor.unobserveElement(element)
  }
}
