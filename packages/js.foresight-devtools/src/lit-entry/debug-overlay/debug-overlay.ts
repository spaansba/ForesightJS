import { LitElement, html, css } from "lit"
import { customElement, state } from "lit/decorators.js"
import "./mouse-trajectory"
import "./scroll-trajectory"
import "./element-overlays"
import type {
  MouseTrajectoryUpdateEvent,
  ScrollTrajectoryUpdateEvent,
  ForesightElementData,
  CallbackInvokedEvent,
  CallbackCompletedEvent,
} from "js.foresight"

@customElement("debug-overlay")
export class DebugOverlay extends LitElement {
  @state() private mouseTrajectoryRef!: any
  @state() private scrollTrajectoryRef!: any
  @state() private elementOverlaysRef!: any

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
    this.elementOverlaysRef = this.shadowRoot!.querySelector("element-overlays")
  }

  public createOrUpdateElementOverlay(
    elementData: ForesightElementData,
    showNameTags: boolean = true
  ) {
    if (this.elementOverlaysRef) {
      this.elementOverlaysRef.createOrUpdateElementOverlay(elementData, showNameTags)
    }
  }

  public removeElementOverlay(elementData: ForesightElementData) {
    if (this.elementOverlaysRef) {
      this.elementOverlaysRef.removeElementOverlay(elementData)
    }
  }

  public handleCallbackInvoked(event: CallbackInvokedEvent) {
    if (this.elementOverlaysRef) {
      this.elementOverlaysRef.highlightElementCallback(event.elementData, event.hitType)
    }
  }

  public handleCallbackCompleted(event: CallbackCompletedEvent) {
    if (this.elementOverlaysRef) {
      this.elementOverlaysRef.unhighlightElementCallback(event.elementData)
    }
  }

  public updateNameTagVisibility(showNameTags: boolean) {
    if (this.elementOverlaysRef) {
      this.elementOverlaysRef.updateNameTagVisibility(showNameTags)
    }
  }

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
