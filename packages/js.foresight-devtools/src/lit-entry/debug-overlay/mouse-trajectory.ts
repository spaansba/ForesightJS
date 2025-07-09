import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import { ForesightManager, type MouseTrajectoryUpdateEvent } from "js.foresight"

@customElement("mouse-trajectory")
export class MouseTrajectory extends LitElement {
  @state() private predictedMouseIndicator!: HTMLElement
  @state() private mouseTrajectoryLine!: HTMLElement

  static styles = [
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }

      .mouse-predicted {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform;
        display: none !important;
      }

      .trajectory-line {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform;
        display: none;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, rgba(59, 130, 246, 0.4));
        transform-origin: left center;
        z-index: 9999;
        border-radius: 2px;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
        position: relative;
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

  private _abortController: AbortController | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    ForesightManager.instance.addEventListener(
      "mouseTrajectoryUpdate",
      (e: MouseTrajectoryUpdateEvent) => {
        this.updateTrajectory(e)
      },
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  firstUpdated() {
    const container = this.shadowRoot!.querySelector("#trajectory-container")!
    this.predictedMouseIndicator = container.querySelector(".mouse-predicted")! as HTMLElement
    this.mouseTrajectoryLine = container.querySelector(".trajectory-line")! as HTMLElement
  }

  public updateTrajectory(event: MouseTrajectoryUpdateEvent) {
    if (!this.predictedMouseIndicator || !this.mouseTrajectoryLine) {
      return
    }

    const { predictedPoint, currentPoint } = event.trajectoryPositions

    // Use transform for positioning to avoid layout reflow.
    // The CSS handles centering the element with `translate(-50%, -50%)`.
    this.predictedMouseIndicator.style.transform = `translate3d(${predictedPoint.x}px, ${predictedPoint.y}px, 0) translate3d(-50%, -50%, 0)`
    this.predictedMouseIndicator.style.display = event.predictionEnabled ? "block" : "none"

    // This hides the circle from the UI at the top-left corner when refreshing the page with the cursor outside of the window
    if (predictedPoint.x === 0 && predictedPoint.y === 0) {
      this.predictedMouseIndicator.style.display = "none"
      return
    }

    if (!event.predictionEnabled) {
      this.mouseTrajectoryLine.style.display = "none"
      return
    }

    const dx = predictedPoint.x - currentPoint.x
    const dy = predictedPoint.y - currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    // Use a single transform to position, rotate, and scale the line,
    // avoiding reflow from top/left changes.
    this.mouseTrajectoryLine.style.transform = `translate3d(${currentPoint.x}px, ${currentPoint.y}px, 0) rotate(${angle}deg)`
    this.mouseTrajectoryLine.style.width = `${length}px`
    this.mouseTrajectoryLine.style.display = "block"
  }

  render() {
    return html`
      <div id="trajectory-container">
        <div class="mouse-predicted"></div>
        <div class="trajectory-line"></div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "mouse-trajectory": MouseTrajectory
  }
}
