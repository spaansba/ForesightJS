import type { ForesightManagerSettings } from "js.foresight"
import { ForesightManager } from "js.foresight"
import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"

import type { DevtoolsSettings } from "../../../types/types"
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
import "../base-tab/chip"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../copy-icon/copy-icon"
import "./setting-item/setting-item-checkbox"
import "./setting-item/setting-item-range"
import "../base-tab/chip"
import { ForesightDevtools } from "../../foresight-devtools"

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
  @state() private changedSettings: {
    name: string
    initial: any
    current: any
  }[] = []

  private _abortController: AbortController | null = null

  constructor() {
    super()
    const currentDevtoolsSettings = ForesightDevtools.instance.devtoolsSettings
    const currentManagerSettings = ForesightManager.instance.getManagerData.globalSettings

    this.devtoolsSettings = { ...currentDevtoolsSettings }
    this.managerSettings = { ...currentManagerSettings }

    this.initialSettings = {
      devtools: { ...currentDevtoolsSettings },
      manager: { ...currentManagerSettings },
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
    const changes: { name: string; initial: any; current: any }[] = []
    this._checkManagerSettingsChanges(changes)
    this._checkDevtoolsSettingsChanges(changes)
    this.changedSettings = changes
  }

  private _checkManagerSettingsChanges(
    changes: { name: string; initial: any; current: any }[]
  ): void {
    const managerKeys: (keyof ForesightManagerSettings)[] = [
      "enableMousePrediction",
      "enableTabPrediction",
      "enableScrollPrediction",
      "trajectoryPredictionTime",
      "positionHistorySize",
      "tabOffset",
      "scrollMargin",
    ]

    for (const key of managerKeys) {
      const initialValue = this.initialSettings.manager[key]
      const currentValue = this.managerSettings[key]
      if (initialValue !== currentValue) {
        changes.push({ name: key, initial: initialValue, current: currentValue })
      }
    }
  }

  private _checkDevtoolsSettingsChanges(
    changes: { name: string; initial: any; current: any }[]
  ): void {
    const devtoolsKeys: (keyof DevtoolsSettings)[] = ["showNameTags"]

    for (const key of devtoolsKeys) {
      const initialValue = this.initialSettings.devtools[key]
      const currentValue = this.devtoolsSettings[key]
      if (initialValue !== currentValue) {
        changes.push({ name: key, initial: initialValue, current: currentValue })
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

  private async handleCopySettings(): Promise<void> {
    if (!this.managerSettings) {
      return
    }

    try {
      const settingsCode = this.generateSettingsCode(this.managerSettings)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(settingsCode)
      }
    } catch (err) {
      console.error("Failed to copy settings code:", err)
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
    const settings = this.managerSettings

    const chipTitle =
      this.changedSettings.length > 0
        ? `Settings that have been changed this session compared to your initialized settings.\nClick on the copy icon to easely copy the new setting into your project\n\n` +
          this.changedSettings
            .map(
              change =>
                `${change.name}: ${JSON.stringify(change.initial)} -> ${JSON.stringify(
                  change.current
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
