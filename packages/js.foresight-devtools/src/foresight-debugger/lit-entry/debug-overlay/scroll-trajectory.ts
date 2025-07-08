import { LitElement, html, css } from "lit"
import { customElement } from "lit/decorators.js"
import type { ScrollTrajectoryUpdateEvent } from "js.foresight"

@customElement("scroll-trajectory")
export class ScrollTrajectory extends LitElement {
  private scrollTrajectoryLine!: HTMLElement

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

      .scroll-trajectory-line {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform;
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
        display: none;
        animation: scroll-dash-flow 1.5s linear infinite;
        position: relative;
        box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
      }

      .scroll-trajectory-line::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid #22c55e;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6));
        animation: scroll-arrow-pulse 1.5s ease-in-out infinite;
      }

      @keyframes scroll-dash-flow {
        0% { background-position: 0px 0px; }
        100% { background-position: 16px 0px; }
      }

      @keyframes scroll-arrow-pulse {
        0%, 100% { 
          transform: translateY(-50%) scale(1);
          filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.6));
        }
        50% {
          transform: translateY(-50%) scale(1.2);
          filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.8));
        }
      }
    `,
  ]

  firstUpdated() {
    const container = this.shadowRoot!.querySelector('#scroll-container')!
    this.scrollTrajectoryLine = container.querySelector('.scroll-trajectory-line')! as HTMLElement
  }

  public updateScrollTrajectory(event: ScrollTrajectoryUpdateEvent) {
    if (!this.scrollTrajectoryLine) return
    
    const dx = event.predictedPoint.x - event.currentPoint.x
    const dy = event.predictedPoint.y - event.currentPoint.y

    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    this.scrollTrajectoryLine.style.transform = `translate3d(${event.currentPoint.x}px, ${event.currentPoint.y}px, 0) rotate(${angle}deg)`
    this.scrollTrajectoryLine.style.width = `${length}px`
    this.scrollTrajectoryLine.style.display = "block"
  }

  public hide() {
    if (this.scrollTrajectoryLine) {
      this.scrollTrajectoryLine.style.display = "none"
    }
  }

  render() {
    return html`
      <div id="scroll-container">
        <div class="scroll-trajectory-line"></div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scroll-trajectory": ScrollTrajectory
  }
}