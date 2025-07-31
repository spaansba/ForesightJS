import { LitElement, css, html } from "lit"
import { customElement, state } from "lit/decorators.js"
import { classMap } from "lit/directives/class-map.js"
import { ForesightManager } from "js.foresight"

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

    .touch-device-warning {
      background-color: rgba(255, 193, 7, 0.9);
      color: #000;
      padding: 8px 12px;
      margin: 8px 0;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .touch-device-warning.hidden {
      display: none;
    }

    .warning-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .warning-icon {
      font-weight: bold;
      font-size: 14px;
    }

    .dismiss-button {
      background: none;
      border: none;
      color: #000;
      font-size: 16px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      font-weight: bold;
    }

    .dismiss-button:hover {
      opacity: 0.7;
    }
  `
  @state() private activeTab: ControllerTabs
  @state() private isMinimized: boolean =
    ForesightDevtools.instance.devtoolsSettings.isControlPanelDefaultMinimized
  @state() private isTouchDevice: boolean = false
  @state() private isWarningDismissed: boolean = false

  private localStorageSelectedTabKey = "foresight-devtools-control-panel-tab"
  private _abortController: AbortController | null = null

  constructor() {
    super()
    this.activeTab = this.getStoredTab()
    this.isTouchDevice = ForesightManager.instance.getManagerData.currentDeviceStrategy === "touch"
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    ForesightManager.instance.addEventListener(
      "deviceStrategyChanged",
      e => {
        this.isTouchDevice = e.newStrategy === "touch"
        if (e.newStrategy === "touch") {
          this.isWarningDismissed = false
        }
      },
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  private getStoredTab(): ControllerTabs {
    try {
      const tab = localStorage.getItem(this.localStorageSelectedTabKey)
      return (tab as ControllerTabs) || "logs"
    } catch (error) {
      console.error(error)
      return "logs"
    }
  }
  private _handleTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tab
    this.setStoredTab(this.activeTab)
  }

  private setStoredTab(tab: ControllerTabs): void {
    try {
      localStorage.setItem(this.localStorageSelectedTabKey, tab)
    } catch (error) {
      // Silently fail - localStorage may be disabled (private browsing, etc.)
      console.warn("ForesightDevtools: Failed to save tab preference to localStorage:", error)
    }
  }

  private dismissWarning(): void {
    this.isWarningDismissed = true
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

        <div
          class="touch-device-warning ${this.isMinimized ||
          !this.isTouchDevice ||
          this.isWarningDismissed
            ? "hidden"
            : ""}"
        >
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span>Touch device mode: Overlays and visibility sorting not available</span>
          </div>
          <button @click="${this.dismissWarning}" class="dismiss-button" title="Dismiss warning">
            ×
          </button>
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
