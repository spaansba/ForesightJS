import type { ForesightElement, ForesightManagerSettings } from "../types/types"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ElementObservingModule } from "../core/ElementObservingModule"
import { ViewportPredictor } from "../predictors/ViewportPredictor"
import { TouchStartPredictor } from "../predictors/TouchStartPredictor"

export class TouchDeviceHandler extends ElementObservingModule {
  private predictors: { viewport: ViewportPredictor; onTouchStart: TouchStartPredictor }
  private predictor: ElementObservingModule | undefined

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
    this.predictors = {
      viewport: new ViewportPredictor(dependencies),
      onTouchStart: new TouchStartPredictor(dependencies),
    }
  }

  public onSettingsChanged(changed: ReadonlySet<keyof ForesightManagerSettings>): void {
    if (changed.has("touchDeviceStrategy") && this.isConnected) {
      this.connectPredictor()
    }
  }

  protected onConnect(): void {
    this.connectPredictor()
  }

  private connectPredictor(): void {
    this.predictor?.disconnect()

    const strategy = this.settings.touchDeviceStrategy
    this.predictor = strategy === "none" ? undefined : this.predictors[strategy]

    if (!this.predictor) {
      return
    }

    this.predictor.connect()

    for (const [element, entry] of this.elements) {
      if (entry.state.isActive) {
        this.predictor.observeElement(element)
      }
    }
  }

  protected onDisconnect(): void {
    this.predictor?.disconnect()
  }

  public observeElement(element: ForesightElement): void {
    this.predictor?.observeElement(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.predictor?.unobserveElement(element)
  }
}
