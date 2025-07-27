import { BasePredictor, type BasePredictorConfig } from "./BasePredictor"

export class ViewportPredictor extends BasePredictor {
  private intersectionObserver: IntersectionObserver | null = null
  constructor(dependencies: BasePredictorConfig) {
    super(dependencies)
  }
  protected initializeListeners(): void {
    // This predictor does not need to initialize any listeners
    // as it is used for viewport-based predictions only
  }
  public cleanup(): void {
    this.intersectionObserver?.disconnect()
    this.intersectionObserver = null
  }

  public connect(): void {
    this.intersectionObserver = new IntersectionObserver(this.handleViewportEnter.bind(this))
  }
  public disconnect(): void {}

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
