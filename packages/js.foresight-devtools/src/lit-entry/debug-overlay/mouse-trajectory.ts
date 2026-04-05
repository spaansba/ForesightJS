import { LitElement, html, css } from "lit"
import { customElement } from "lit/decorators.js"
import {
  ForesightManager,
  type MouseTrajectoryUpdateEvent,
  type ManagerSettingsChangedEvent,
} from "js.foresight"
import type { ElementUnregisteredEvent } from "js.foresight"
import type { CallbackCompletedEvent } from "js.foresight"

export type Point = {
  x: number
  y: number
}
@customElement("mouse-trajectory")
export class MouseTrajectory extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .trajectory-line {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform, width;
        transform-origin: left center;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.4));
        z-index: 9999;
        border-radius: 2px;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
      }

      .trajectory-line::after {
        content: "";
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid #3b82f6;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
      }
    `,
  ]

  private _abortController = new AbortController()
  private _lineEl: HTMLElement | null = null
  private _mousePredictionIsEnabled =
    ForesightManager.instance.getManagerData.globalSettings.enableMousePrediction
  private _isVisible = false

  connectedCallback(): void {
    super.connectedCallback()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener("callbackCompleted", this.handleTrajectoryReset, {
      signal,
    })

    ForesightManager.instance.addEventListener("elementUnregistered", this.handleTrajectoryReset, {
      signal,
    })

    ForesightManager.instance.addEventListener(
      "mouseTrajectoryUpdate",
      this.handleTrajectoryUpdate,
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "scrollTrajectoryUpdate",
      () => {
        this._setVisible(false)
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "managerSettingsChanged",
      this.handleSettingsChange,
      { signal }
    )
  }

  protected firstUpdated(): void {
    this._lineEl = this.shadowRoot!.querySelector<HTMLElement>(".trajectory-line")
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
        this._lineEl.style.transform = "translate3d(0px, 0px, 0) rotate(0deg)"
        this._lineEl.style.width = "0px"
      }
    }
  }

  private handleSettingsChange = (e: ManagerSettingsChangedEvent) => {
    const isEnabled = e.managerData.globalSettings.enableMousePrediction
    this._mousePredictionIsEnabled = isEnabled
    if (!isEnabled) {
      this._setVisible(false)
    }
  }

  private handleTrajectoryUpdate = (e: MouseTrajectoryUpdateEvent) => {
    if (!this._mousePredictionIsEnabled) return

    this._setVisible(true)

    const { currentPoint, predictedPoint } = e.trajectoryPositions
    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * 57.29577951308232 // Pre-calculate rad to deg

    if (this._lineEl) {
      this._lineEl.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
      this._lineEl.style.width = `${length}px`
    }
  }

  render() {
    return html`<div class="trajectory-line"></div>`
  }
}
