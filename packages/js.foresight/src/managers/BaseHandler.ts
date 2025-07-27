import type {
  CallCallbackFunction,
  EmitFunction,
  PredictorDependencies,
} from "js.foresight/predictors/BasePredictor"
import type {
  ForesightElement,
  ForesightElementData,
  ForesightManagerSettings,
} from "js.foresight/types/types"

export abstract class BaseHandler {
  protected elements: ReadonlyMap<ForesightElement, ForesightElementData>
  protected callCallback: CallCallbackFunction
  protected emit: EmitFunction
  protected settings: ForesightManagerSettings

  constructor(config: PredictorDependencies) {
    this.elements = config.elements
    this.callCallback = config.callCallback
    this.emit = config.emit
    this.settings = config.settings!
  }

  public abstract disconnect(): void
  public abstract connect(): void
  public abstract observeElement(element: ForesightElement): void
  public abstract unobserveElement(element: ForesightElement): void
}
