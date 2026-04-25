import { LitElement, html, css } from "lit"
import { customElement } from "lit/decorators.js"
import type {
  ScrollTrajectoryUpdateEvent,
  ManagerSettingsChangedEvent,
  ElementUnregisteredEvent,
  CallbackCompletedEvent,
} from "js.foresight"
import { ForesightManager } from "js.foresight"
import type { Point } from "./mouse-trajectory"

@customElement("scroll-trajectory")
export class ScrollTrajectory extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      :host([hidden]) {
        display: none;
      }

      .scroll-trajectory-line {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform, width;
        transform-origin: left center;
        height: 4px;
        background: repeating-linear-gradient(
          90deg,
          #eab308 0px,
          #eab308 8px,
          transparent 8px,
          transparent 16px
        );
        z-index: 9999;
        border-radius: 2px;
        animation: scroll-dash-flow 1.5s linear infinite;
        box-shadow: 0 0 12px rgba(234, 179, 8, 0.4);
      }

      .scroll-trajectory-line::after {
        content: "";
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid #eab308;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.6));
        animation: scroll-arrow-pulse 1.5s ease-in-out infinite;
      }

      @keyframes scroll-dash-flow {
        0% {
          background-position: 0px 0px;
        }
        100% {
          background-position: 16px 0px;
        }
      }

      @keyframes scroll-arrow-pulse {
        0%,
        100% {
          transform: translateY(-50%) scale(1);
          filter: drop-shadow(0 0 6px rgba(234, 179, 8, 0.6));
        }
        50% {
          transform: translateY(-50%) scale(1.2);
          filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.8));
        }
      }
    `,
  ]

  private _abortController = new AbortController()
  private _lineEl: HTMLElement | null = null
  private _scrollPredictionIsEnabled =
    ForesightManager.instance.getManagerData.globalSettings.enableScrollPrediction
  private _scrollMargin = ForesightManager.instance.getManagerData.globalSettings.scrollMargin
  private _isVisible = false
  private _latestCurrentPoint: Point | null = null
  private _latestPredictedPoint: Point | null = null
  private _isUpdateScheduled = false

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

  protected firstUpdated(): void {
    this._lineEl = this.shadowRoot!.querySelector<HTMLElement>(".scroll-trajectory-line")
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController.abort()
  }

  private _setVisible(visible: boolean): void {
    if (this._isVisible === visible) return
    this._isVisible = visible
    if (this._lineEl) {
      this._lineEl.style.display = visible ? "block" : "none"
    }
  }

  private handleTrajectoryReset = (e: CallbackCompletedEvent | ElementUnregisteredEvent) => {
    const shouldReset =
      ("wasLastActiveElement" in e && e.wasLastActiveElement) ||
      ("wasLastRegisteredElement" in e && e.wasLastRegisteredElement)

    if (shouldReset) {
      this._setVisible(false)
      if (this._lineEl) {
        this._lineEl.style.transform = "translate(0px, 0px) rotate(0deg)"
      }
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
      if (this._lineEl) {
        this._lineEl.style.width = `${this._scrollMargin}px`
      }
    }
  }

  private handleScrollUpdate = (e: ScrollTrajectoryUpdateEvent) => {
    if (!this._scrollPredictionIsEnabled) return

    this._setVisible(true)
    this._latestCurrentPoint = e.currentPoint
    this._latestPredictedPoint = e.predictedPoint

    if (!this._isUpdateScheduled) {
      this._isUpdateScheduled = true
      this.applyScrollTransform()
    }
  }

  private applyScrollTransform = () => {
    if (!this._latestCurrentPoint || !this._latestPredictedPoint) {
      this._isUpdateScheduled = false
      return
    }

    const dx = this._latestPredictedPoint.x - this._latestCurrentPoint.x
    const dy = this._latestPredictedPoint.y - this._latestCurrentPoint.y
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    if (this._lineEl) {
      this._lineEl.style.transform = `translate(${this._latestCurrentPoint.x}px, ${this._latestCurrentPoint.y}px) rotate(${angle}deg)`
    }

    this._isUpdateScheduled = false
  }

  render() {
    return html`<div class="scroll-trajectory-line" style="width: ${this._scrollMargin}px"></div>`
  }
}
