import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { classMap } from "lit/directives/class-map.js"

import "./element-tab/element-tab"
import "./base-tab/tab-selector"
import "./log-tab/log-tab"
import "./settings-tab/settings-tab"
import type { ControllerTabs } from "../../types/types"
import { ForesightDevtools } from "../foresight-devtools"

@customElement("control-panel")
export class ControlPanel extends LitElement {
  static styles = css`
    .control-wrapper {
      padding: 12px;
      position: fixed;
      bottom: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 13px;
      z-index: 10001;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      width: 450px;
      height: 450px;
      transition: width 0.3s ease, height 0.3s ease;
      box-sizing: border-box;
    }
    .control-wrapper.minimized {
      width: 230px;
      height: 45px;
    }

    .title-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0;
      flex-shrink: 0;
    }

    .title-wrapper h1 {
      margin: 0;
      font-size: 15px;
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
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }

    .tab-container.hidden {
      display: none;
    }

    .tab-content {
      flex: 1;
      position: relative;
    }

    .tab-content > * {
      display: none;
    }

    .tab-content > .active {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  `
  @state() private activeTab: ControllerTabs
  @state() private isMinimized: boolean =
    ForesightDevtools.instance.devtoolsSettings.isControlPanelDefaultMinimized

  private localStorageSelectedTabKey = "foresight-devtools-control-panel-tab"
  constructor() {
    super()
    const tab = localStorage.getItem(this.localStorageSelectedTabKey)
    this.activeTab = (tab as ControllerTabs) || "logs"
  }
  private _handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tab
    localStorage.setItem(this.localStorageSelectedTabKey, this.activeTab)
  }

  protected render() {
    return html`
      <div class="control-wrapper ${this.isMinimized ? "minimized" : ""}">
        <div class="title-wrapper">
          <button @click="${() => (this.isMinimized = !this.isMinimized)}" class="minimize-button">
            -
          </button>
          <h1>Foresight DevTools</h1>
          <div></div>
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
