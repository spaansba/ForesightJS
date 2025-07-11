import type {
  CallCallbackFunction,
  EmitFunction,
  ForesightElement,
  ForesightElementData,
} from "js.foresight/types/types"

export abstract class BasePredictor {
  protected abortController: AbortController
  protected elements: ReadonlyMap<ForesightElement, ForesightElementData>
  protected callbackFunction: CallCallbackFunction
  protected emit: EmitFunction
  constructor(
    elements: ReadonlyMap<ForesightElement, ForesightElementData>,
    callbackFunction: CallCallbackFunction,
    emit: EmitFunction
  ) {
    this.elements = elements
    this.callbackFunction = callbackFunction
    this.emit = emit
    this.abortController = new AbortController()
  }
  public abort() {
    this.abortController.abort()
  }

  protected abstract cleanup(): void
  protected abstract initializeListeners(): void
}
