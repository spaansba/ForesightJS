import type { ForesightElement } from "../types/types"
import { BaseForesightModule } from "../core/BaseForesightModule"

export class TouchStartPredictor extends BaseForesightModule {
  // Change to touchstart ones it is baseline https://developer.mozilla.org/en-US/docs/Web/API/Element/touchstart_event
  public observeElement(element: ForesightElement): void {
    if (element instanceof HTMLElement) {
      element.addEventListener("pointerdown", this.handleTouchStart, {
        signal: this.abortController.signal,
      })
    }
  }

  // Change to touchstart ones it is baseline https://developer.mozilla.org/en-US/docs/Web/API/Element/touchstart_event
  public unobserveElement(element: ForesightElement): void {
    if (element instanceof HTMLElement) {
      element.removeEventListener("pointerdown", this.handleTouchStart)
    }
  }

  protected handleTouchStart = (e: PointerEvent): void => {
    const currentTarget = e.currentTarget as ForesightElement
    const data = this.deps.elements.get(currentTarget)

    if (data) {
      this.deps.callCallback(data, {
        kind: "touch",
      })
      this.unobserveElement(currentTarget)
    }
  }
}
