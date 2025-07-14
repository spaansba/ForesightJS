import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import { styleMap } from "lit/directives/style-map.js"
import {
  ForesightManager,
  type MouseTrajectoryUpdateEvent,
  type ManagerSettingsChangedEvent,
} from "js.foresight"
import type { ElementUnregisteredEvent } from "packages/js.foresight/dist"

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

  @state()
  private _mousePredictionIsEnabled =
    ForesightManager.instance.getManagerData.globalSettings.enableMousePrediction

  @state()
  private _isVisible = false

  @state()
  private _trajectoryStyles: { [key: string]: string } = {}

  connectedCallback(): void {
    super.connectedCallback()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener(
      "mouseTrajectoryUpdate",
      this.handleTrajectoryUpdate,
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      this.handleElementUnregistered,
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
      this.handleSettingsChange,
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController.abort()
  }

  // On last element make sure to remove any leftovers
  private handleElementUnregistered = (e: ElementUnregisteredEvent) => {
    if (e.wasLastElement) {
      this._isVisible = false
    }
  }
  private handleSettingsChange = (e: ManagerSettingsChangedEvent) => {
    const isEnabled = e.managerData.globalSettings.enableMousePrediction
    this._mousePredictionIsEnabled = isEnabled
    if (!isEnabled) {
      this._isVisible = false
    }
    this.requestUpdate()
  }

  private handleTrajectoryUpdate = (e: MouseTrajectoryUpdateEvent) => {
    if (!this._mousePredictionIsEnabled) return

    this._isVisible = true

    const { currentPoint, predictedPoint } = e.trajectoryPositions
    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)

    const angle = Math.atan2(dy, dx) * 57.29577951308232 // Pre-calculate rad to deg
    this._trajectoryStyles = {
      transform: `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`,
      width: `${length}px`,
    }
  }

  render() {
    const combinedStyles = {
      display: this._isVisible ? "block" : "none",
      ...this._trajectoryStyles,
    }
    return html` <div class="trajectory-line" style=${styleMap(combinedStyles)}></div> `
  }
}
