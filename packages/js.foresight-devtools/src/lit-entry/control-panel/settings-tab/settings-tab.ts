import type {
  ForesightManagerSettings,
  TouchDeviceStrategy,
  MinimumConnectionType,
  UpdatedManagerSetting,
} from "js.foresight"
import { ForesightManager } from "js.foresight"
import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"

import type { Corner, DevtoolsSettings } from "../../../types/types"
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
} from "../../../constants"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../copy-icon/copy-icon"
import "./setting-item/setting-item-checkbox"
import "./setting-item/setting-item-range"
import "./setting-item/setting-item"
import "../dropdown/single-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../base-tab/chip"
import { ForesightDevtools } from "../../foresight-devtools"

// A helper type to represent a change in a Devtools setting
type UpdatedDevtoolsSetting = {
  [K in keyof DevtoolsSettings]: {
    setting: K
    newValue: DevtoolsSettings[K]
    oldValue: DevtoolsSettings[K]
  }
}[keyof DevtoolsSettings]

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
  `

  @state() private managerSettings: ForesightManagerSettings
  @state() private initialSettings: Readonly<{
    manager: ForesightManagerSettings
    devtools: DevtoolsSettings
  }>
  @state() private devtoolsSettings: DevtoolsSettings
  @state() private changedSettings: (UpdatedManagerSetting | UpdatedDevtoolsSetting)[] = []
  @state() private currentCorner: Corner = "bottom-right"
  @state() private touchDeviceStrategyOptions: DropdownOption[] = [
    {
      value: "onTouchStart",
      label: "On Touch Start",
      title: "Execute callbacks when user touches registered elements",
      icon: html`<span>Touch</span>`,
    },
    {
      value: "viewport",
      label: "Viewport Entry",
      title: "Execute callbacks when registered elements enter the viewport",
      icon: html`<span>Viewport</span>`,
    },
    {
      value: "none",
      label: "None",
      title: "Disable touch device prediction",
      icon: html`<span>None</span>`,
    },
  ]

  @state() private minimumConnectionTypeOptions: DropdownOption[] = [
    {
      value: "slow-2g",
      label: "Slow 2G",
      title: "Slow 2G",
      icon: html`<span>Slow 2G</span>`,
    },
    {
      value: "2g",
      label: "2G",
      title: "2G",
      icon: html`<span>2G</span>`,
    },
    {
      value: "3g",
      label: "3G",
      title: "3G",
      icon: html`<span>3G</span>`,
    },
    {
      value: "4g",
      label: "4G",
      title: "4G",
      icon: html`<span>4G</span>`,

  @state() private cornerOptions: DropdownOption[] = [
    {
      value: "top-left",
      label: "Top Left",
      title: "Position control panel in top-left corner",
      icon: html`<span>↖</span>`,
    },
    {
      value: "top-right",
      label: "Top Right",
      title: "Position control panel in top-right corner",
      icon: html`<span>↗</span>`,
    },
    {
      value: "bottom-left",
      label: "Bottom Left",
      title: "Position control panel in bottom-left corner",
      icon: html`<span>↙</span>`,
    },
    {
      value: "bottom-right",
      label: "Bottom Right",
      title: "Position control panel in bottom-right corner",
      icon: html`<span>↘</span>`,
    },
  ]

  private _abortController: AbortController | null = null

  constructor() {
    super()
    const currentDevtoolsSettings = ForesightDevtools.instance.devtoolsSettings
    const currentManagerSettings = ForesightManager.instance.getManagerData.globalSettings

    // Shallow copy is sufficient for settings objects
    this.devtoolsSettings = Object.assign({}, currentDevtoolsSettings)
    this.managerSettings = Object.assign({}, currentManagerSettings)
    this.currentCorner = this.getCurrentCorner()

    this.initialSettings = {
      devtools: Object.assign({}, currentDevtoolsSettings),
      manager: Object.assign({}, currentManagerSettings),
    }
  }

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    ForesightManager.instance.addEventListener(
      "managerSettingsChanged",
      e => {
        this.managerSettings = e.managerData.globalSettings
        this._updateChangedSettings()
      },
      { signal }
    )

    this._updateChangedSettings()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
  }

  private _updateChangedSettings(): void {
    const changes: (UpdatedManagerSetting | UpdatedDevtoolsSetting)[] = []
    this._checkManagerSettingsChanges(changes)
    this._checkDevtoolsSettingsChanges(changes)
    this.changedSettings = changes
  }

  private _checkManagerSettingsChanges(
    changes: (UpdatedManagerSetting | UpdatedDevtoolsSetting)[]
  ): void {
    const managerKeys: (keyof ForesightManagerSettings)[] = [
      "enableMousePrediction",
      "enableTabPrediction",
      "enableScrollPrediction",
      "trajectoryPredictionTime",
      "positionHistorySize",
      "tabOffset",
      "scrollMargin",
      "touchDeviceStrategy",
      "minimumConnectionType",
    ]

    for (const key of managerKeys) {
      const oldValue = this.initialSettings.manager[key]
      const newValue = this.managerSettings[key]
      if (oldValue !== newValue) {
        changes.push({
          setting: key,
          oldValue,
          newValue,
        } as UpdatedManagerSetting)
      }
    }
  }

  private _checkDevtoolsSettingsChanges(
    changes: (UpdatedManagerSetting | UpdatedDevtoolsSetting)[]
  ): void {
    const devtoolsKeys: (keyof DevtoolsSettings)[] = ["showNameTags"]

    for (const key of devtoolsKeys) {
      const oldValue = this.initialSettings.devtools[key]
      const newValue = this.devtoolsSettings[key]
      if (oldValue !== newValue) {
        changes.push({
          setting: key,
          oldValue,
          newValue,
        } as UpdatedDevtoolsSetting)
      }
    }
  }

  private _handleDevtoolsSettingChange(e: CustomEvent<{ setting: string; value: boolean }>): void {
    const { setting, value } = e.detail

    if (setting === "showNameTags") {
      this.devtoolsSettings = {
        ...this.devtoolsSettings,
        showNameTags: value,
      }
      ForesightDevtools.instance.alterDevtoolsSettings({ showNameTags: value })
      this._updateChangedSettings()
    }
  }

  private _handleTouchDeviceStrategyChange = (value: string): void => {
    ForesightManager.instance.alterGlobalSettings({
      touchDeviceStrategy: value as TouchDeviceStrategy,
    })
  }

  private _handleMinimumConnectionTypeChange = (value: string): void => {
    ForesightManager.instance.alterGlobalSettings({
      minimumConnectionType: value as MinimumConnectionType,
    })

  private _handleCornerChange = (value: Corner): void => {
    this.currentCorner = value
    // Dispatch custom event that bubbles up to control panel
    this.dispatchEvent(
      new CustomEvent("corner-change", {
        detail: { corner: value },
        bubbles: true,
        composed: true,
      })
    )
  }

  private getCurrentCorner(): Corner {
    // Get corner from localStorage directly since it's the source of truth
    try {
      const stored = localStorage.getItem("foresight-devtools-control-panel-corner")
      if (stored && ["top-left", "top-right", "bottom-left", "bottom-right"].includes(stored)) {
        return stored as Corner
      }
    } catch (error) {
      console.warn("ForesightDevtools: Failed to load corner from localStorage:", error)
    }
    return "bottom-right"
  }

  private async handleCopySettings(): Promise<void> {
    if (!this.managerSettings) {
      return
    }

    try {
      const settingsCode = this.generateSettingsCode(this.managerSettings)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(settingsCode)
      }
    } catch (error) {
      console.error("Failed to copy settings code:", error)
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
      touchDeviceStrategy: settings.touchDeviceStrategy,
      minimumConnectionType: settings.minimumConnectionType,
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
    const settings = this.managerSettings

    const chipTitle =
      this.changedSettings.length > 0
        ? `Settings that have been changed this session compared to your initialized settings.\nClick on the copy icon to easely copy the new setting into your project\n\n` +
          this.changedSettings
            .map(
              change =>
                `${change.setting}: ${JSON.stringify(change.oldValue)} -> ${JSON.stringify(
                  change.newValue
                )}`
            )
            .join("\n")
        : "No settings changed from initial values"

    return html`
      <tab-header>
        <div slot="chips" class="chips-container">
          <chip-element .title=${chipTitle}> ${this.changedSettings.length} changed </chip-element>
        </div>
        <div slot="actions">
          <copy-icon
            title="Copy current settings as code"
            .onCopy=${() => this.handleCopySettings()}
          ></copy-icon>
        </div>
      </tab-header>

      <tab-content .hasContent=${true}>
        <div class="settings-content">
          <div class="settings-section">
            <div class="settings-group">
              <h4>Mouse Prediction</h4>
              <setting-item-checkbox
                .isChecked=${settings.enableMousePrediction}
                header="Enable Mouse Prediction"
                description="Execute callbacks when mouse is ${settings.trajectoryPredictionTime}ms away from registered elements in mouse direction"
                setting="enableMousePrediction"
              ></setting-item-checkbox>
              <setting-item-range
                .currentValue=${settings.trajectoryPredictionTime}
                .maxValue=${MAX_TRAJECTORY_PREDICTION_TIME}
                .minValue=${MIN_TRAJECTORY_PREDICTION_TIME}
                .unit=${TRAJECTORY_PREDICTION_TIME_UNIT}
                header="Prediction Time"
                description="How far into the future to calculate mouse trajectory path"
                setting="trajectoryPredictionTime"
              ></setting-item-range>
              <setting-item-range
                .currentValue=${settings.positionHistorySize}
                .maxValue=${MAX_POSITION_HISTORY_SIZE}
                .minValue=${MIN_POSITION_HISTORY_SIZE}
                .unit=${POSITION_HISTORY_SIZE_UNIT}
                header="Position History Size"
                description="How far into the future, in ${POSITION_HISTORY_SIZE_UNIT}, to calculate mouse trajectory path"
                setting="positionHistorySize"
              >
              </setting-item-range>
            </div>
            <div class="settings-group">
              <h4>Keyboard Navigation</h4>
              <setting-item-checkbox
                .isChecked=${settings.enableTabPrediction}
                header="Enable Tab Prediction"
                description="Execute callbacks when user ${settings.tabOffset} tabbable elements away from registered elements in tab direction"
                setting="enableTabPrediction"
              >
              </setting-item-checkbox>
              <setting-item-range
                .currentValue=${settings.tabOffset}
                .maxValue=${MAX_TAB_OFFSET}
                .minValue=${MIN_TAB_OFFSET}
                .unit=${TAB_OFFSET_UNIT}
                header="Tab Offset"
                description="Number of tabbable elements to look ahead when predicting navigation"
                setting="tabOffset"
              >
              </setting-item-range>
            </div>

            <div class="settings-group">
              <h4>Scroll Prediction</h4>
              <setting-item-checkbox
                .isChecked=${settings.enableScrollPrediction}
                header="Enable Scroll Prediction"
                description="Execute callbacks when user is ${settings.scrollMargin}px away from registered elements in scroll direction"
                setting="enableScrollPrediction"
              ></setting-item-checkbox>
              <setting-item-range
                .currentValue=${settings.scrollMargin}
                .maxValue=${MAX_SCROLL_MARGIN}
                .minValue=${MIN_SCROLL_MARGIN}
                .unit=${SCROLL_MARGIN_UNIT}
                header="Scroll Margin"
                description="Pixel distance to check from mouse position in scroll direction"
                setting="scrollMargin"
              ></setting-item-range>
            </div>

            <div class="settings-group">
              <h4>Touch Device</h4>
              <setting-item
                header="Touch Device Strategy"
                description="How to handle prediction on touch devices"
              >
                <single-select-dropdown
                  slot="controls"
                  .dropdownOptions=${this.touchDeviceStrategyOptions}
                  .selectedOptionValue=${settings.touchDeviceStrategy}
                  .onSelectionChange=${this._handleTouchDeviceStrategyChange}
                ></single-select-dropdown>
              </setting-item>
            </div>

            <div class="settings-group">
              <h4>Minimum Connection</h4>
              <setting-item
                header="Minimum Connection Type"
                description="Minimum connection speed required to register elements"
              >
                <single-select-dropdown
                  slot="controls"
                  .dropdownOptions=${this.minimumConnectionTypeOptions}
                  .selectedOptionValue=${settings.minimumConnectionType}
                  .onSelectionChange=${this._handleMinimumConnectionTypeChange}
                ></single-select-dropdown>
              </setting-item>
            </div>

            <!-- Developer Tools Group -->
            <div class="settings-group">
              <h4>Developer Tools</h4>
              <setting-item-checkbox
                .isChecked=${this.devtoolsSettings.showNameTags}
                header="Show Name Tags"
                description="Display name tags over each registered element in the debugger"
                setting="showNameTags"
                @setting-changed=${this._handleDevtoolsSettingChange}
              ></setting-item-checkbox>
              <setting-item
                header="Panel Position"
                description="Choose which corner to position the control panel"
              >
                <single-select-dropdown
                  slot="controls"
                  .dropdownOptions=${this.cornerOptions}
                  .selectedOptionValue=${this.currentCorner}
                  .onSelectionChange=${this._handleCornerChange}
                ></single-select-dropdown>
              </setting-item>
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
