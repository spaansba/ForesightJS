import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import "./element-overlays"
import "./mouse-trajectory"
import "./scroll-trajectory"
import { ForesightManager } from "js.foresight"
import type { DeviceStrategyChangedEvent } from "js.foresight"

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

  private _abortController: AbortController | null = null
  @state()
  private _strategy: "mouse" | "touch" | "pen" =
    ForesightManager.instance.getManagerData.currentDeviceStrategy

  @property({ type: Boolean }) showElementOverlays = true
  @property({ type: Boolean }) showMouseTrajectory = true
  @property({ type: Boolean }) showScrollTrajectory = true
  @property({ type: Boolean }) showNameTags = true

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener(
      "deviceStrategyChanged",
      this.handleDeviceStrategyChange,
      { signal }
    )
  }

  private handleDeviceStrategyChange = (event: DeviceStrategyChangedEvent) =>
    (this._strategy = event.newStrategy)

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
  }

  render() {
    return html`
      <div id="overlay-container">
        ${this._strategy === "mouse"
          ? html`
              <mouse-trajectory ?hidden=${!this.showMouseTrajectory}></mouse-trajectory>
              <scroll-trajectory ?hidden=${!this.showScrollTrajectory}></scroll-trajectory>
              <element-overlays
                ?hidden=${!this.showElementOverlays}
                .showNameTags=${this.showNameTags}
              ></element-overlays>
            `
          : ""}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "debug-overlay": DebugOverlay
  }
}
