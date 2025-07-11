import type {
  CallbackHitType,
  ForesightElement,
  ForesightElementData,
  ForesightEvent,
  ForesightEventMap,
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
  
  constructor(config: BasePredictorConfig) {
    this.elements = config.dependencies.elements
    this.callCallback = config.dependencies.callCallback
    this.emit = config.dependencies.emit
    this.abortController = new AbortController()
  }
  
  protected abort(): void {
    this.abortController.abort()
  }

  public abstract cleanup(): void
  protected abstract initializeListeners(): void
  
  protected handleError(error: unknown, context: string): void {
    console.error(`${this.constructor.name} error in ${context}:`, error)
  }
}
