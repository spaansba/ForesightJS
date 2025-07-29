import type { ForesightElement } from "../types/types"
import { BaseForesightModule, type ForesightModuleDependencies } from "../core/BaseForesightModule"

export class ViewportPredictor extends BaseForesightModule {
  protected readonly moduleName = "ViewportPredictor"
  
  private intersectionObserver: IntersectionObserver | null = null
  constructor(dependencies: ForesightModuleDependencies) {
    super(dependencies)
  }

  protected onConnect(): void {
    this.intersectionObserver = new IntersectionObserver(this.handleViewportEnter.bind(this))
  }
  protected onDisconnect(): void {
    this.intersectionObserver?.disconnect()
    this.intersectionObserver = null
  }
  public observeElement(element: ForesightElement): void {
    this.intersectionObserver?.observe(element)
  }
  public unobserveElement(element: ForesightElement): void {
    this.intersectionObserver?.unobserve(element)
  }
  protected handleViewportEnter(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const data = this.elements.get(entry.target as ForesightElement)
        if (data) {
          this.callCallback(data, {
            kind: "viewport",
          })

          this.unobserveElement(entry.target as ForesightElement)
        }
      }
    })
  }
}
