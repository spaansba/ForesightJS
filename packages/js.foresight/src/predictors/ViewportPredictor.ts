import type { ForesightElement } from "../types/types"
import { BaseForesightModule } from "../core/BaseForesightModule"

export class ViewportPredictor extends BaseForesightModule {
  private intersectionObserver: IntersectionObserver | null = null

  protected onConnect(): void {
    this.intersectionObserver = new IntersectionObserver(this.handleViewportEnter)
  }

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

      const data = this.deps.elements.get(entry.target as ForesightElement)

      if (!data) {
        continue
      }

      this.deps.callCallback(data, {
        kind: "viewport",
      })

      this.unobserveElement(entry.target as ForesightElement)
    }
  }
}
