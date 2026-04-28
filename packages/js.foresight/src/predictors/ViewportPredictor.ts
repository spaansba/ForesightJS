import type { ForesightElement } from "../types/types"
import type { ForesightModuleDependencies } from "../core/BaseForesightModule"
import { ElementObservingModule } from "../core/ElementObservingModule"

export class ViewportPredictor extends ElementObservingModule {
  protected readonly moduleName = "ViewportPredictor"

  private intersectionObserver: IntersectionObserver | null = null

  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
  }

  protected onConnect = () =>
    (this.intersectionObserver = new IntersectionObserver(this.handleViewportEnter))

  protected onDisconnect() {
    this.intersectionObserver?.disconnect()
    this.intersectionObserver = null
  }

  public observeElement(element: ForesightElement): void {
    this.intersectionObserver?.observe(element)
  }

  public unobserveElement(element: ForesightElement): void {
    this.intersectionObserver?.unobserve(element)
  }

  protected handleViewportEnter = (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue
      }

      const data = this.elements.get(entry.target as ForesightElement)

      if (!data) {
        continue
      }

      this.callCallback(data, {
        kind: "viewport",
      })

      this.unobserveElement(entry.target as ForesightElement)
    }
  }
}
