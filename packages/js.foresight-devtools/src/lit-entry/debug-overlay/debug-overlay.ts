import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import "./element-overlays"
import "./mouse-trajectory"
import "./scroll-trajectory"
import { ForesightManager } from "js.foresight"

@customElement("debug-overlay")
export class DebugOverlay extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
      #overlay-container {
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 9999;
      }
    `,
  ]

  render() {
    return html`
      <div id="overlay-container">
        <mouse-trajectory></mouse-trajectory>
        <scroll-trajectory></scroll-trajectory>
        <element-overlays></element-overlays>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "debug-overlay": DebugOverlay
  }
}
