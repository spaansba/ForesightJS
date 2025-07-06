import { LitElement, html, css, nothing } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import type { ControllerTabs } from "../types/types"

import "./TabSelector"

@customElement("control-panel")
export class ControlPanel extends LitElement {
  static styles = css`
    .control-wrapper {
      padding: 12px;
      position: fixed;
      bottom: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 13px;
      z-index: 10001;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      width: 400px;
      transition: width 0.3s ease, height 0.3s ease;
    }

    :host.minimized {
      width: 250px;
      overflow: hidden;
      padding: 12px;
      gap: 0px;
    }

    :host.minimized .tab-content {
      height: 0;
      overflow: hidden;
    }

    .title-wrapper {
      display: flex;
      justify-content: space-between;
      padding: 0;
    }

    .title-wrapper h1 {
      margin: 0;
      font-size: 15px;
    }

    .title-element-count {
      font-size: 14px;
      text-align: right;
    }
    .minimize-button {
      background: none;
      border: none;
      color: white;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
  `
  @state() private currentTab: ControllerTabs = "elements"
  @state() private isMinimized: boolean = false

  protected render() {
    return html`
      <div class="control-wrapper">
        <div class="title-wrapper">
          <button @click="${() => (this.isMinimized = !this.isMinimized)}" class="minimize-button">
            -
          </button>
          <h1>Foresight DevTools</h1>
          <span class="title-element-count">0/0</span>
        </div>
        ${this.isMinimized ? nothing : html` <tab-selector>hello</tab-selector> `}
      </div>
    `
  }
}

// Ensure the component is registered immediately
// This helps with bundlers that might not execute the decorator immediately
if (!customElements.get("control-panel")) {
  customElements.define("control-panel", ControlPanel)
}
