import { LitElement, html, css } from "lit"
import { customElement, query } from "lit/decorators.js"
import type {
  ScrollTrajectoryUpdateEvent,
  ManagerSettingsChangedEvent,
  ElementUnregisteredEvent,
  CallbackCompletedEvent,
} from "js.foresight"
import { ForesightManager } from "js.foresight"

@customElement("scroll-trajectory")
export class ScrollTrajectory extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      /* Animations only touch transform and opacity so they stay on the
         compositor. The dash flow slides an oversized strip inside a clipped
         track instead of animating background-position. */
      .scroll-trajectory {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        height: 4px;
        transform-origin: left center;
        will-change: transform;
        z-index: 9999;
      }

      .track {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-radius: 2px;
        box-shadow: 0 0 12px rgba(234, 179, 8, 0.4);
      }

      .dashes {
        position: absolute;
        top: 0;
        left: -16px;
        width: calc(100% + 16px);
        height: 100%;
        background: repeating-linear-gradient(
          90deg,
          #eab308 0px,
          #eab308 8px,
          transparent 8px,
          transparent 16px
        );
        animation: scroll-dash-flow 1.5s linear infinite;
      }

      .arrow {
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        border-left: 8px solid #eab308;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.6));
        animation: scroll-arrow-pulse 1.5s ease-in-out infinite;
      }

      @keyframes scroll-dash-flow {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(16px);
        }
      }

      @keyframes scroll-arrow-pulse {
        0%,
        100% {
          transform: translateY(-50%) scale(1);
        }
        50% {
          transform: translateY(-50%) scale(1.2);
        }
      }
    `,
  ]

  private _abortController = new AbortController()
  @query(".scroll-trajectory", true) private _lineEl!: HTMLElement
  private _scrollPredictionIsEnabled =
    ForesightManager.instance.getManagerData.globalSettings.enableScrollPrediction
  private _scrollMargin = ForesightManager.instance.getManagerData.globalSettings.scrollMargin
  private _isVisible = false

  connectedCallback(): void {
    super.connectedCallback()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener("scrollTrajectoryUpdate", this.handleScrollUpdate, {
      signal,
    })

    ForesightManager.instance.addEventListener(
      "mouseTrajectoryUpdate",
      () => {
        this._setVisible(false)
      },
      { signal }
    )

    ForesightManager.instance.addEventListener("callbackCompleted", this.handleTrajectoryReset, {
      signal,
    })

    ForesightManager.instance.addEventListener("elementUnregistered", this.handleTrajectoryReset, {
      signal,
    })

    ForesightManager.instance.addEventListener(
      "managerSettingsChanged",
      this.handleSettingsChange,
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController.abort()
  }

  private _setVisible(visible: boolean): void {
    if (!this.hasUpdated || this._isVisible === visible) {
      return
    }

    this._isVisible = visible
    this._lineEl.style.display = visible ? "block" : "none"
  }

  private handleTrajectoryReset = (e: CallbackCompletedEvent | ElementUnregisteredEvent) => {
    const shouldReset =
      ("wasLastActiveElement" in e && e.wasLastActiveElement) ||
      ("wasLastRegisteredElement" in e && e.wasLastRegisteredElement)

    if (shouldReset) {
      this._setVisible(false)
    }
  }

  private handleSettingsChange = (e: ManagerSettingsChangedEvent) => {
    const isEnabled = e.managerData.globalSettings.enableScrollPrediction
    this._scrollPredictionIsEnabled = isEnabled
    if (!isEnabled) {
      this._setVisible(false)
    }

    const scrollMarginUpdate = e.updatedSettings.find(update => update.setting === "scrollMargin")
    if (scrollMarginUpdate) {
      this._scrollMargin = scrollMarginUpdate.newValue
      if (this.hasUpdated) {
        this._lineEl.style.width = `${this._scrollMargin}px`
      }
    }
  }

  private handleScrollUpdate = (e: ScrollTrajectoryUpdateEvent) => {
    if (!this.hasUpdated || !this._scrollPredictionIsEnabled) {
      return
    }

    this._setVisible(true)

    const { currentPoint, predictedPoint } = e
    const angle =
      (Math.atan2(predictedPoint.y - currentPoint.y, predictedPoint.x - currentPoint.x) * 180) /
      Math.PI

    this._lineEl.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
  }

  render() {
    return html`
      <div class="scroll-trajectory" style="width: ${this._scrollMargin}px">
        <div class="track"><div class="dashes"></div></div>
        <div class="arrow"></div>
      </div>
    `
  }
}
