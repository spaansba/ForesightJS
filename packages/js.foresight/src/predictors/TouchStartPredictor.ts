import type { ForesightElement } from "js.foresight/types/types"
import { BasePredictor, type PredictorDependencies } from "./BasePredictor"

export class TouchStartPredictor extends BasePredictor {
  constructor(dependencies: PredictorDependencies) {
    super(dependencies)
  }

  public connect(): void {
    this.createNewAbortController()
  }
  public disconnect(): void {
    this.abort()
  }
  public observeElement(element: ForesightElement): void {
    element.addEventListener("touchstart", this.handleTouchStart, {
      signal: this.abortController.signal,
    })
  }
  public unobserveElement(element: ForesightElement): void {
    element.removeEventListener("touchstart", this.handleTouchStart)
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
}
