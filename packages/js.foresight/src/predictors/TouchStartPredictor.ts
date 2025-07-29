import type { ForesightElement } from "../types/types"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"

export class TouchStartPredictor extends BaseForesightModule {
  protected readonly moduleName = "TouchStartPredictor"

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
  }

  protected onConnect(): void {
    this.createAbortController()
  }

  protected onDisconnect(): void {}

  public observeElement(element: ForesightElement): void {
    if (element instanceof HTMLElement) {
      element.addEventListener("touchstart", this.handleTouchStart, {
        signal: this.abortController?.signal,
      })
    }
  }
  public unobserveElement(element: ForesightElement): void {
    if (element instanceof HTMLElement) {
      element.removeEventListener("touchstart", this.handleTouchStart)
    }
  }

  protected handleTouchStart = (e: TouchEvent): void => {
    const target = e.target as ForesightElement
    const data = this.elements.get(target)
    if (data) {
      this.callCallback(data, {
        kind: "touch",
      })
      this.unobserveElement(target)
    }
  }
}
