import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import { styleMap } from "lit/directives/style-map.js"
import {
  ForesightManager,
  type MouseTrajectoryUpdateEvent,
  type ManagerSettingsChangedEvent,
} from "js.foresight"

@customElement("mouse-trajectory")
export class MouseTrajectory extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .trajectory-line {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform, width;
        transform: translate3d(var(--current-x), var(--current-y), 0)
          rotate(var(--trajectory-angle));
        width: var(--trajectory-length);
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.4));
        transform-origin: left center;
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

  private trajectoryLineElement?: HTMLElement
  private _abortController = new AbortController()

  @state()
  private _mousePredictionIsEnabled =
    ForesightManager.instance.getManagerData.globalSettings.enableMousePrediction

  @state()
  private _isVisible = false

  connectedCallback(): void {
    super.connectedCallback()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener(
      "mouseTrajectoryUpdate",
      (e: MouseTrajectoryUpdateEvent) => {
        if (this._mousePredictionIsEnabled) {
          this._isVisible = true // Show the line
          this.updateTrajectoryLine(e)
        }
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "scrollTrajectoryUpdate",
      () => {
        this._isVisible = false
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "managerSettingsChanged",
      (e: ManagerSettingsChangedEvent) => {
        const isEnabled = e.managerData.globalSettings.enableMousePrediction
        this._mousePredictionIsEnabled = isEnabled
        if (!isEnabled) {
          this._isVisible = false
        }
      },
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController.abort()
  }

  firstUpdated() {
    this.trajectoryLineElement = this.shadowRoot?.querySelector(".trajectory-line") as HTMLElement
  }

  private updateTrajectoryLine(e: MouseTrajectoryUpdateEvent) {
    if (!this.trajectoryLineElement) return

    const currentPoint = e.trajectoryPositions.currentPoint
    const predictedPoint = e.trajectoryPositions.predictedPoint
    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    this.trajectoryLineElement.style.setProperty("--current-x", `${currentPoint.x}px`)
    this.trajectoryLineElement.style.setProperty("--current-y", `${currentPoint.y}px`)
    this.trajectoryLineElement.style.setProperty("--trajectory-angle", `${angle}deg`)
    this.trajectoryLineElement.style.setProperty("--trajectory-length", `${length}px`)
  }

  render() {
    const styles = { display: this._isVisible ? "block" : "none" }
    return html` <div class="trajectory-line" style=${styleMap(styles)}></div> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mouse-trajectory": MouseTrajectory
  }
}
