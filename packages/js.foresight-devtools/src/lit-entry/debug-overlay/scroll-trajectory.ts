import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import { styleMap } from "lit/directives/style-map.js"
import type { ScrollTrajectoryUpdateEvent, ManagerSettingsChangedEvent } from "js.foresight"
import { ForesightManager } from "js.foresight"

@customElement("scroll-trajectory")
export class ScrollTrajectory extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }

      .scroll-trajectory-line {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform, width;
        transform: translate3d(var(--scroll-current-x), var(--scroll-current-y), 0)
          rotate(var(--scroll-trajectory-angle));
        width: var(--scroll-trajectory-length);
        /* display is now controlled by styleMap */
        height: 4px;
        background: repeating-linear-gradient(
          90deg,
          #22c55e 0px,
          #22c55e 8px,
          transparent 8px,
          transparent 16px
        );
        transform-origin: left center;
        z-index: 9999;
        border-radius: 2px;
        animation: scroll-dash-flow 1.5s linear infinite;
        box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
      }

      .scroll-trajectory-line::after {
        /* styles omitted for brevity */
      }
      /* keyframes omitted for brevity */
    `,
  ]

  private scrollTrajectoryLineElement?: HTMLElement
  private _abortController = new AbortController()

  @state()
  private _scrollPredictionIsEnabled =
    ForesightManager.instance.getManagerData.globalSettings.enableScrollPrediction

  @state()
  private _isVisible = false

  connectedCallback(): void {
    super.connectedCallback()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener(
      "scrollTrajectoryUpdate",
      (e: ScrollTrajectoryUpdateEvent) => {
        if (this._scrollPredictionIsEnabled) {
          this._isVisible = true
          this.updateScrollTrajectoryLine(e)
        }
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "mouseTrajectoryUpdate",
      () => {
        this._isVisible = false
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "managerSettingsChanged",
      (e: ManagerSettingsChangedEvent) => {
        const isEnabled = e.managerData.globalSettings.enableScrollPrediction
        this._scrollPredictionIsEnabled = isEnabled
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
    // Get the stable element reference.
    this.scrollTrajectoryLineElement = this.shadowRoot?.querySelector(
      ".scroll-trajectory-line"
    ) as HTMLElement
  }

  private updateScrollTrajectoryLine(e: ScrollTrajectoryUpdateEvent) {
    if (!this.scrollTrajectoryLineElement) return

    const currentPoint = e.currentPoint
    const predictedPoint = e.predictedPoint
    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    this.scrollTrajectoryLineElement.style.setProperty("--scroll-current-x", `${currentPoint.x}px`)
    this.scrollTrajectoryLineElement.style.setProperty("--scroll-current-y", `${currentPoint.y}px`)
    this.scrollTrajectoryLineElement.style.setProperty("--scroll-trajectory-angle", `${angle}deg`)
    this.scrollTrajectoryLineElement.style.setProperty("--scroll-trajectory-length", `${length}px`)
  }

  render() {
    const styles = { display: this._isVisible ? "block" : "none" }
    // The div is always in the DOM, its style is reactive.
    return html` <div class="scroll-trajectory-line" style=${styleMap(styles)}></div> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scroll-trajectory": ScrollTrajectory
  }
}
