import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "./mouse-trajectory"
import "./scroll-trajectory"
import type { MouseTrajectoryUpdateEvent, ScrollTrajectoryUpdateEvent } from "js.foresight"

@customElement("debug-overlay")
export class DebugOverlay extends LitElement {
  @state() private mouseTrajectoryRef!: any
  @state() private scrollTrajectoryRef!: any

  static styles = [
    css`
      :host {
        display: block;
      }
      #overlay-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }
    `,
  ]

  firstUpdated() {
    this.mouseTrajectoryRef = this.shadowRoot!.querySelector("mouse-trajectory")
    this.scrollTrajectoryRef = this.shadowRoot!.querySelector("scroll-trajectory")
  }

  public handleMouseTrajectoryUpdate(event: MouseTrajectoryUpdateEvent) {
    if (this.mouseTrajectoryRef) {
      this.mouseTrajectoryRef.updateTrajectory(event)
      // Hide scroll visuals on mouse move
      if (this.scrollTrajectoryRef) {
        this.scrollTrajectoryRef.hide()
      }
    }
  }

  public handleScrollTrajectoryUpdate(event: ScrollTrajectoryUpdateEvent) {
    if (this.scrollTrajectoryRef) {
      this.scrollTrajectoryRef.updateScrollTrajectory(event)
    }
  }

  render() {
    return html`
      <div id="overlay-container">
        <mouse-trajectory></mouse-trajectory>
        <scroll-trajectory></scroll-trajectory>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "debug-overlay": DebugOverlay
  }
}
