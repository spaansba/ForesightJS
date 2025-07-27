import type {
  CallbackHitType,
  ForesightElement,
  ForesightElementData,
  ForesightEvent,
  ForesightEventMap,
  ForesightManagerSettings,
} from "../types/types"

export type CallCallbackFunction = (
  elementData: ForesightElementData,
  callbackHitType: CallbackHitType
) => void

export type EmitFunction = <K extends ForesightEvent>(event: ForesightEventMap[K]) => void

export type PredictorDependencies = {
  elements: ReadonlyMap<ForesightElement, ForesightElementData>
  callCallback: CallCallbackFunction
  emit: EmitFunction
  settings: ForesightManagerSettings
}

export interface BasePredictorConfig {
  dependencies: PredictorDependencies
}

export type PredictorProps = PredictorDependencies

export abstract class BasePredictor {
  protected abortController: AbortController
  protected elements: ReadonlyMap<ForesightElement, ForesightElementData>
  protected callCallback: CallCallbackFunction
  protected emit: EmitFunction
  protected settings: ForesightManagerSettings

  constructor(dependencies: PredictorDependencies) {
    this.elements = dependencies.elements
    this.callCallback = dependencies.callCallback
    this.emit = dependencies.emit
    this.settings = dependencies.settings
    this.abortController = new AbortController()
  }

  public abstract connect(): void
  public abstract disconnect(): void
  protected abort(): void {
    this.abortController.abort()
  }
  protected abstract initializeListeners(): void

  protected handleError(error: unknown, context: string): void {
    console.error(`${this.constructor.name} error in ${context}:`, error)
  }
}
