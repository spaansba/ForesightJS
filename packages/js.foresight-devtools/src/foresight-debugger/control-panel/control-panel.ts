import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { classMap } from "lit/directives/class-map.js"
import type { ControllerTabs } from "../../types/types"

import "./element-tab/element-tab"
import "./base-tab/tab-selector"
import "./log-tab/log-tab"
import "./settings-tab/settings-tab"

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
      height: 400px;
      transition: width 0.3s ease, height 0.3s ease;
      box-sizing: border-box;
    }
    .control-wrapper.minimized {
      width: 220px;
      height: 42px; /* Set a fixed height for the minimized state */
    }

    .title-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0;
      flex-shrink: 0; /* Prevent this from shrinking */
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

    .tab-container {
      /* Make this container a flex column that grows to fill the
         remaining space in .control-wrapper */
      display: flex;
      flex-direction: column;
      flex: 1;
      /* This is important to contain the children */
      overflow: hidden;
      margin-top: 10px;
    }

    .tab-container.hidden {
      display: none;
    }

    .tab-content {
      /* Make this container grow to fill the remaining space
         in .tab-container (after the tab-selector) */
      flex: 1;
      /* This is needed so the child's height: 100% works */
      position: relative;
    }

    .tab-content > * {
      /* Hide all tabs by default */
      display: none;
    }

    .tab-content > .active {
      /*
        CRITICAL CHANGE:
        Change 'display: block' to 'display: flex'.
        This is because your element-tab's :host is a flex container.
        This ensures it behaves as intended.
      */
      display: flex;
      /* Make the active tab fill the entire .tab-content area */
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `
  @state() private activeTab: ControllerTabs = "elements"
  @state() private isMinimized: boolean = false

  private _handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tab
  }

  protected render() {
    return html`
      <div class="control-wrapper ${this.isMinimized ? "minimized" : ""}">
        <div class="title-wrapper">
          <button @click="${() => (this.isMinimized = !this.isMinimized)}" class="minimize-button">
            -
          </button>
          <h1>Foresight DevTools</h1>
          <span class="title-element-count">0/0</span>
        </div>

        <div class="tab-container ${this.isMinimized ? "hidden" : ""}">
          <tab-selector
            .activeTab="${this.activeTab}"
            @tab-change="${this._handleTabChange}"
          ></tab-selector>

          <div class="tab-content">
            <log-tab class=${classMap({ active: this.activeTab === "logs" })}></log-tab>
            <element-tab class=${classMap({ active: this.activeTab === "elements" })}></element-tab>
            <settings-tab
              class=${classMap({ active: this.activeTab === "settings" })}
            ></settings-tab>
          </div>
        </div>
      </div>
    `
  }
}

if (!customElements.get("control-panel")) {
  customElements.define("control-panel", ControlPanel)
}
