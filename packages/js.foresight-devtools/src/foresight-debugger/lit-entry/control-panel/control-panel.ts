import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { classMap } from "lit/directives/class-map.js"

import "./element-tab/element-tab"
import "./base-tab/tab-selector"
import "./log-tab/log-tab"
import "./settings-tab/settings-tab"
import type { ControllerTabs } from "packages/js.foresight-devtools/src/types/types"

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
      width: 400px;
      height: 430px;
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
  @state() private activeTab: ControllerTabs = "elements"
  @state() private isMinimized: boolean = false
  @state() private visibleCount: number = 0
  @state() private totalCount: number = 0

  private _handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tab
  }

  private _handleVisibilityCountChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ visibleCount: number; totalCount: number }>
    this.visibleCount = customEvent.detail.visibleCount
    this.totalCount = customEvent.detail.totalCount
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener("visibility-count-updated", this._handleVisibilityCountChange)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener("visibility-count-updated", this._handleVisibilityCountChange)
  }

  protected render() {
    return html`
      <div class="control-wrapper ${this.isMinimized ? "minimized" : ""}">
        <div class="title-wrapper">
          <button @click="${() => (this.isMinimized = !this.isMinimized)}" class="minimize-button">
            -
          </button>
          <h1>Foresight DevTools</h1>
          <span
            title="Number of visible registered elements / total registered elements"
            class="title-element-count"
            >${this.visibleCount}/${this.totalCount}</span
          >
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
