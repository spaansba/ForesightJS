import type { ForesightElement } from "../types/types"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ViewportPredictor } from "../predictors/ViewportPredictor"
import { TouchStartPredictor } from "../predictors/TouchStartPredictor"

export class TouchDeviceHandler extends BaseForesightModule {
  protected readonly moduleName = "TouchDeviceHandler"

  private viewportPredictor: ViewportPredictor
  private touchStartPredictor: TouchStartPredictor
  private predictor: ViewportPredictor | TouchStartPredictor | null = null

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)

    this.viewportPredictor = new ViewportPredictor(dependencies)

    this.touchStartPredictor = new TouchStartPredictor(dependencies)

    this.predictor = this.viewportPredictor
  }

  public setTouchPredictor() {
    this.predictor?.disconnect()

    switch (this.settings.touchDeviceStrategy) {
      case "viewport":
        this.predictor = this.viewportPredictor
        this.devLog(`Connected touch strategy: viewport (ViewportPredictor)`)
        break
      case "onTouchStart":
        this.predictor = this.touchStartPredictor
        this.devLog(`Connected touch strategy: onTouchStart (TouchStartPredictor)`)
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

  public observeElement = (element: ForesightElement) => this.predictor?.observeElement(element)
  public unobserveElement = (element: ForesightElement) => this.predictor?.unobserveElement(element)
}
