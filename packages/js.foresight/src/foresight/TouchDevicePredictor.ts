import type { ForesightElement, TouchDeviceStrategy } from "js.foresight/types/types"
import { BasePredictor, type BasePredictorConfig } from "./BasePredictor"

export interface TouchDeviceConfig extends BasePredictorConfig {
  touchDeviceStrategy: TouchDeviceStrategy
}

export class TouchDevicePredictor extends BasePredictor {
  public touchDeviceStrategy: TouchDeviceStrategy
  private intersectionObserver: IntersectionObserver | null = null
  constructor(config: TouchDeviceConfig) {
    super(config)
    this.touchDeviceStrategy = config.touchDeviceStrategy
    this.initializeListeners()
  }

  protected initializeListeners(): void {
    if (this.touchDeviceStrategy === "viewport") {
      this.cleanupOnTouchStartListeners()
      this.intersectionObserver = new IntersectionObserver(this.handleViewportEnter.bind(this))
    } else if (this.touchDeviceStrategy === "onTouchStart") {
      this.cleanupViewportListeners()
    }
    for (const element of this.elements.keys()) {
      this.observeElement(element)
    }
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

  public observeElement(element: ForesightElement): void {
    if (this.touchDeviceStrategy === "viewport") {
      this.intersectionObserver?.observe(element)
    } else {
      element.addEventListener("touchstart", this.handleTouchStart, {
        signal: this.abortController.signal,
      })
    }
  }

  public unobserveElement(element: ForesightElement): void {
    if (this.touchDeviceStrategy === "viewport") {
      this.intersectionObserver?.unobserve(element)
    } else {
      element.removeEventListener("touchstart", this.handleTouchStart)
    }
  }

  protected cleanupViewportListeners(): void {
    this.intersectionObserver?.disconnect()
    this.intersectionObserver = null
  }

  protected cleanupOnTouchStartListeners(): void {
    this.abort()
  }

  public cleanup(): void {
    this.cleanupViewportListeners()
    this.cleanupOnTouchStartListeners()
  }
}
