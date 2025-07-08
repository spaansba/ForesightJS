import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { ForesightManager } from "js.foresight"
import type { ForesightManagerSettings } from "js.foresight"

import "../base-tab/tab-header"
import "../base-tab/tab-content"
import "../base-tab/chip"
import "../copy-icon/copy-icon"
import { ForesightDebuggerLit } from "../../../ForesightDebuggerLit"
import type { DevtoolsSettings } from "packages/js.foresight-devtools/src/types/types"
import {
  MAX_POSITION_HISTORY_SIZE,
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_POSITION_HISTORY_SIZE,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
  POSITION_HISTORY_SIZE_UNIT,
  SCROLL_MARGIN_UNIT,
  TAB_OFFSET_UNIT,
  TRAJECTORY_PREDICTION_TIME_UNIT,
} from "../../../../constants"

@customElement("settings-tab")
export class SettingsTab extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .settings-content {
      display: block;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .settings-group {
      background: rgba(30, 30, 30, 0.6);
      padding: 16px;
      border: 1px solid rgba(176, 196, 222, 0.1);
    }

    .settings-group h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #b0c4de;
      border-bottom: 1px solid rgba(176, 196, 222, 0.2);
      padding-bottom: 8px;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(80, 80, 80, 0.2);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-item label {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 500;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      min-width: 180px;
    }

    .setting-description {
      font-size: 11px;
      color: #9e9e9e;
      line-height: 1.3;
      font-weight: normal;
    }

    .setting-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .setting-value {
      font-size: 12px;
      color: #b0c4de;
      font-weight: 500;
      min-width: 45px;
      text-align: right;
    }

    /* Modern Toggle Switches */
    input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      position: relative;
      width: 44px;
      height: 22px;
      background-color: #444;
      cursor: pointer;
      outline: none;
      transition: all 0.3s ease;
      vertical-align: middle;
      flex-shrink: 0;
      margin: 0;
      border: 2px solid #555;
    }

    input[type="checkbox"]::before {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      background-color: white;
      top: 1px;
      left: 1px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    input[type="checkbox"]:checked {
      background-color: #b0c4de;
      border-color: #b0c4de;
    }

    input[type="checkbox"]:checked::before {
      transform: translateX(22px);
      background-color: white;
    }

    input[type="checkbox"]:hover {
      box-shadow: 0 0 0 3px rgba(176, 196, 222, 0.1);
    }

    /* Modern Range Sliders */
    input[type="range"] {
      margin: 0;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      height: 22px;
      vertical-align: middle;
      width: 100px;
    }

    input[type="range"]::-webkit-slider-runnable-track {
      height: 6px;
      background: #444;
      border: 1px solid #555;
    }

    input[type="range"]::-moz-range-track {
      height: 6px;
      background: #444;
      border: 1px solid #555;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      margin-top: -7px;
      background: #b0c4de;
      height: 20px;
      width: 20px;
      border: 2px solid #333;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    }

    input[type="range"]::-moz-range-thumb {
      background: #b0c4de;
      height: 20px;
      width: 20px;
      border: 2px solid #333;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
    }

    input[type="range"]:hover::-webkit-slider-thumb {
      transform: scale(1.1);
      box-shadow: 0 0 0 4px rgba(176, 196, 222, 0.2);
    }

    input[type="range"]:hover::-moz-range-thumb {
      transform: scale(1.1);
      box-shadow: 0 0 0 4px rgba(176, 196, 222, 0.2);
    }
  `

  @state() private managerSettings: ForesightManagerSettings | null = null
  @state() private devtoolsSettings: DevtoolsSettings | null = null

  private _abortController: AbortController | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    // Get initial settings
    this.managerSettings = ForesightManager.instance.getManagerData.globalSettings
    this.devtoolsSettings = ForesightDebuggerLit.instance.devtoolsSettings

    // Listen for settings changes
    ForesightManager.instance.addEventListener(
      "managerSettingsChanged",
      () => {
        this.managerSettings = ForesightManager.instance.getManagerData.globalSettings
      },
      { signal }
    )
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  private handleManagerSettingChange(
    setting: keyof ForesightManagerSettings,
    value: boolean | number
  ): void {
    ForesightManager.instance.alterGlobalSettings({
      [setting]: value,
    })
  }

  private handleDevtoolsSettingChange(setting: keyof DevtoolsSettings, value: boolean): void {
    ForesightDebuggerLit.instance.alterDebuggerSettings({
      [setting]: value,
    })
  }

  private handleRangeChange(event: Event, setting: keyof ForesightManagerSettings): void {
    const target = event.target as HTMLInputElement
    const value = parseInt(target.value, 10)
    this.handleManagerSettingChange(setting, value)
  }

  private handleCheckboxChange(
    event: Event,
    setting: keyof ForesightManagerSettings | keyof DevtoolsSettings
  ): void {
    const target = event.target as HTMLInputElement
    const isChecked = target.checked

    if (setting === "showNameTags") {
      this.handleDevtoolsSettingChange(setting, isChecked)
    } else {
      this.handleManagerSettingChange(setting as keyof ForesightManagerSettings, isChecked)
    }
  }

  private async handleCopySettings(): Promise<void> {
    if (!this.managerSettings) {
      return
    }

    try {
      const settingsCode = this.generateSettingsCode(this.managerSettings)
      await navigator.clipboard.writeText(settingsCode)
    } catch (err) {
      console.error("Failed to copy settings to clipboard:", err)
    }
  }

  private generateSettingsCode(settings: ForesightManagerSettings): string {
    const settingsObject = {
      enableMousePrediction: settings.enableMousePrediction,
      enableTabPrediction: settings.enableTabPrediction,
      enableScrollPrediction: settings.enableScrollPrediction,
      positionHistorySize: settings.positionHistorySize,
      trajectoryPredictionTime: settings.trajectoryPredictionTime,
      tabOffset: settings.tabOffset,
      scrollMargin: settings.scrollMargin,
    }

    return `ForesightManager.initialize(${JSON.stringify(settingsObject, null, 2)})`
  }

  render() {
    if (!this.managerSettings || !this.devtoolsSettings) {
      return html`<tab-content
        .noContentMessage=${"Loading settings..."}
        .hasContent=${false}
      ></tab-content>`
    }

    return html`
      <tab-header>
        <div slot="actions">
          <copy-icon
            title="Copy current settings as code"
            .onCopy=${this.handleCopySettings}
          ></copy-icon>
        </div>
      </tab-header>

      <tab-content .hasContent=${true}>
        <div class="settings-content">
          <div class="settings-section">
            <!-- Mouse Prediction Group -->
            <div class="settings-group">
              <h4>Mouse Prediction</h4>
              <div class="setting-item">
                <label>
                  Enable Mouse Prediction
                  <span class="setting-description">
                    Predict mouse movement trajectory and trigger callbacks before cursor reaches
                    target
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="checkbox"
                    .checked=${this.managerSettings.enableMousePrediction}
                    @change=${(e: Event) => this.handleCheckboxChange(e, "enableMousePrediction")}
                  />
                </div>
              </div>
              <div class="setting-item">
                <label>
                  Position History
                  <span class="setting-description">
                    Number of past mouse positions stored for velocity calculations
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="range"
                    min="${MIN_POSITION_HISTORY_SIZE}"
                    max="${MAX_POSITION_HISTORY_SIZE}"
                    .value=${this.managerSettings.positionHistorySize.toString()}
                    @input=${(e: Event) => this.handleRangeChange(e, "positionHistorySize")}
                  />
                  <span class="setting-value">
                    ${this.managerSettings.positionHistorySize} ${POSITION_HISTORY_SIZE_UNIT}
                  </span>
                </div>
              </div>
              <div class="setting-item">
                <label>
                  Prediction Time
                  <span class="setting-description">
                    How far into the future to calculate mouse trajectory path
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="range"
                    min="${MIN_TRAJECTORY_PREDICTION_TIME}"
                    max="${MAX_TRAJECTORY_PREDICTION_TIME}"
                    step="10"
                    .value=${this.managerSettings.trajectoryPredictionTime.toString()}
                    @input=${(e: Event) => this.handleRangeChange(e, "trajectoryPredictionTime")}
                  />
                  <span class="setting-value">
                    ${this.managerSettings.trajectoryPredictionTime}
                    ${TRAJECTORY_PREDICTION_TIME_UNIT}
                  </span>
                </div>
              </div>
            </div>

            <!-- Keyboard Navigation Group -->
            <div class="settings-group">
              <h4>Keyboard Navigation</h4>
              <div class="setting-item">
                <label>
                  Enable Tab Prediction
                  <span class="setting-description">
                    Execute callbacks when user is within tab offset of registered elements
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="checkbox"
                    .checked=${this.managerSettings.enableTabPrediction}
                    @change=${(e: Event) => this.handleCheckboxChange(e, "enableTabPrediction")}
                  />
                </div>
              </div>
              <div class="setting-item">
                <label>
                  Tab Offset
                  <span class="setting-description">
                    Number of tabbable elements to look ahead when predicting navigation
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="range"
                    min="${MIN_TAB_OFFSET}"
                    max="${MAX_TAB_OFFSET}"
                    step="1"
                    .value=${this.managerSettings.tabOffset.toString()}
                    @input=${(e: Event) => this.handleRangeChange(e, "tabOffset")}
                  />
                  <span class="setting-value"
                    >${this.managerSettings.tabOffset} ${TAB_OFFSET_UNIT}</span
                  >
                </div>
              </div>
            </div>

            <!-- Scroll Prediction Group -->
            <div class="settings-group">
              <h4>Scroll Prediction</h4>
              <div class="setting-item">
                <label>
                  Enable Scroll Prediction
                  <span class="setting-description">
                    Predict scroll direction and trigger callbacks for elements in path
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="checkbox"
                    .checked=${this.managerSettings.enableScrollPrediction}
                    @change=${(e: Event) => this.handleCheckboxChange(e, "enableScrollPrediction")}
                  />
                </div>
              </div>
              <div class="setting-item">
                <label>
                  Scroll Margin
                  <span class="setting-description">
                    Pixel distance to check from mouse position in scroll direction
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="range"
                    min="${MIN_SCROLL_MARGIN}"
                    max="${MAX_SCROLL_MARGIN}"
                    step="10"
                    .value=${this.managerSettings.scrollMargin.toString()}
                    @input=${(e: Event) => this.handleRangeChange(e, "scrollMargin")}
                  />
                  <span class="setting-value"
                    >${this.managerSettings.scrollMargin} ${SCROLL_MARGIN_UNIT}</span
                  >
                </div>
              </div>
            </div>

            <!-- Developer Tools Group -->
            <div class="settings-group">
              <h4>Developer Tools</h4>
              <div class="setting-item">
                <label>
                  Show Name Tags
                  <span class="setting-description">
                    Display name tags over each registered element in debug mode
                  </span>
                </label>
                <div class="setting-controls">
                  <input
                    type="checkbox"
                    .checked=${this.devtoolsSettings.showNameTags}
                    @change=${(e: Event) => this.handleCheckboxChange(e, "showNameTags")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-tab": SettingsTab
  }
}
