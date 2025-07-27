import type { ForesightElement } from "js.foresight/types/types"
import { type PredictorDependencies } from "../predictors/BasePredictor"
import { BaseHandler } from "./BaseHandler"
import { ViewportPredictor } from "js.foresight/predictors/ViewportPredictor"
import { TouchStartPredictor } from "js.foresight/predictors/TouchStartPredictor"

export class TouchDeviceHandler extends BaseHandler {
  private viewportPredictor: ViewportPredictor
  private touchStartPredictor: TouchStartPredictor
  private predictor: ViewportPredictor | TouchStartPredictor
  constructor(config: PredictorDependencies) {
    super(config)
    this.viewportPredictor = new ViewportPredictor({ dependencies: config })
    this.touchStartPredictor = new TouchStartPredictor({ dependencies: config })
    this.predictor = this.viewportPredictor
  }

  public disconnect(): void {
    this.cleanup()
  }

  public connect(): void {
    if (this.settings.touchDeviceStrategy === "viewport") {
      this.viewportPredictor.connect()
      this.predictor = this.viewportPredictor
    } else {
      this.viewportPredictor.cleanup()
      this.predictor = this.touchStartPredictor
    }
    for (const element of this.elements.keys()) {
      this.predictor.observeElement(element)
    }
  }

  protected handleTouchStart = (e: Event): void => {
    const touchEvent = e as TouchEvent
    const target = touchEvent.target as ForesightElement
    const data = this.elements.get(target)
    if (data) {
      this.callCallback(data, {
        kind: "touch",
      })
      this.unobserveElement(target)
    }
  }

  public observeElement(element: ForesightElement): void {
    if (this.settings.touchDeviceStrategy === "viewport") {
      this.intersectionObserver?.observe(element)
    } else {
      element.addEventListener("touchstart", this.handleTouchStart, {
        signal: this.abortController.signal,
      })
    }
  }

  public unobserveElement(element: ForesightElement): void {
    if (this.touchDeviceStrategy === "viewport") {
      this.intersectionObserver?.unobserve(element)
    } else {
      element.removeEventListener("touchstart", this.handleTouchStart)
    }
  }

  protected cleanupOnTouchStartListeners(): void {
    this.abort()
  }

  public cleanup(): void {
    this.cleanupViewportListeners()
    this.cleanupOnTouchStartListeners()
  }
}
