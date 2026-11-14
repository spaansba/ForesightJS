import type {
  ForesightManagerSettings,
  TouchDeviceStrategy,
  MinimumConnectionType,
  UpdatedManagerSetting,
} from "js.foresight"
import { ForesightManager } from "js.foresight"
import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"

import {
  SHOW_KEYS,
  type Corner,
  type DevtoolsSettings,
  type ShowKey,
  type ShowSettings,
} from "../../../types/types"
import {
  MAX_SCROLL_MARGIN,
  MAX_TAB_OFFSET,
  MAX_TRAJECTORY_PREDICTION_TIME,
  MIN_SCROLL_MARGIN,
  MIN_TAB_OFFSET,
  MIN_TRAJECTORY_PREDICTION_TIME,
  SCROLL_MARGIN_UNIT,
  TAB_OFFSET_UNIT,
  TRAJECTORY_PREDICTION_TIME_UNIT,
} from "../../../constants"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../copy-icon/copy-icon"
import "./setting-item/setting-toggle"
import "./setting-item/setting-range"
import "./setting-item/setting-item"
import "../dropdown/single-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../base-tab/chip"
import { ForesightDevtools } from "../../foresight-devtools"

// A helper type to represent a change in a Devtools setting
type UpdatedDevtoolsSetting = {
  [K in ShowKey]: {
    setting: `show.${K}`
    newValue: ShowSettings[K]
    oldValue: ShowSettings[K]
  }
}[ShowKey]

@customElement("settings-tab")
export class SettingsTab extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .group {
      padding: 4px 0 6px;
    }

    .group + .group {
      border-top: 1px solid var(--fs-border);
    }

    .group-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 26px;
      padding: 0 6px;
    }

    h4 {
      margin: 0;
      color: var(--fs-muted);
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      cursor: default;
    }

    single-select-dropdown::part(trigger) {
      height: 22px;
      padding: 0 6px 0 8px;
      gap: 6px;
      border: 1px solid var(--fs-border);
      background: var(--fs-surface);
      color: var(--fs-text);
      font-size: 11.5px;
    }

    single-select-dropdown::part(trigger):hover {
      background: var(--fs-hover);
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
    },
  ]

  @state() private cornerOptions: DropdownOption[] = [
    {
      value: "top-left",
      label: "Top Left",
      title: "Position control panel in top-left corner",
      icon: html`<span>Top left</span>`,
    },
    {
      value: "top-right",
      label: "Top Right",
      title: "Position control panel in top-right corner",
      icon: html`<span>Top right</span>`,
    },
    {
      value: "bottom-left",
      label: "Bottom Left",
      title: "Position control panel in bottom-left corner",
      icon: html`<span>Bottom left</span>`,
    },
    {
      value: "bottom-right",
      label: "Bottom Right",
      title: "Position control panel in bottom-right corner",
      icon: html`<span>Bottom right</span>`,
    },
  ]

  private _abortController: AbortController | null = null

  constructor() {
    super()
    const currentDevtoolsSettings = ForesightDevtools.instance.devtoolsSettings
    const currentManagerSettings = ForesightManager.instance.getManagerData.globalSettings

    // Shallow copy is sufficient except for `show`, which we deep-copy so
    // the live and initial snapshots can diverge as the user toggles flags.
    this.devtoolsSettings = {
      ...currentDevtoolsSettings,
      show: { ...currentDevtoolsSettings.show },
    }
    this.managerSettings = Object.assign({}, currentManagerSettings)
    this.currentCorner = this.getCurrentCorner()

    this.initialSettings = {
      devtools: {
        ...currentDevtoolsSettings,
        show: { ...currentDevtoolsSettings.show },
      },
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
    for (const key of SHOW_KEYS) {
      const oldValue = this.initialSettings.devtools.show[key]
      const newValue = this.devtoolsSettings.show[key]
      if (oldValue !== newValue) {
        changes.push({
          setting: `show.${key}`,
          oldValue,
          newValue,
        } as UpdatedDevtoolsSetting)
      }
    }
  }

  private _handleDevtoolsSettingChange(e: CustomEvent<{ setting: string; value: boolean }>): void {
    const { setting, value } = e.detail

    if (!setting.startsWith("show.")) {
      return
    }

    const key = setting.slice("show.".length) as ShowKey
    if (!SHOW_KEYS.includes(key)) {
      return
    }

    this.devtoolsSettings = {
      ...this.devtoolsSettings,
      show: { ...this.devtoolsSettings.show, [key]: value },
    }
    ForesightDevtools.instance.alterDevtoolsSettings({ show: { [key]: value } })
    this._updateChangedSettings()
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
  }

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
        <div slot="chips">
          <chip-element data-tip=${chipTitle}>
            ${this.changedSettings.length} changed
          </chip-element>
        </div>
        <div slot="actions">
          <copy-icon
            data-tip="Copy current settings as code"
            .onCopy=${() => this.handleCopySettings()}
          ></copy-icon>
        </div>
      </tab-header>

      <tab-content .hasContent=${true}>
        <div class="group">
          <div class="group-head">
            <h4
              data-tip="Execute callbacks when the mouse is ${settings.trajectoryPredictionTime}ms away from registered elements in its direction"
            >
              Mouse prediction
            </h4>
            <setting-toggle
              .isChecked=${settings.enableMousePrediction}
              setting="enableMousePrediction"
            ></setting-toggle>
          </div>
          <setting-item
            header="Prediction time"
            description="How far into the future to calculate the mouse trajectory"
            ?dimmed=${!settings.enableMousePrediction}
          >
            <setting-range
              slot="controls"
              .currentValue=${settings.trajectoryPredictionTime}
              .maxValue=${MAX_TRAJECTORY_PREDICTION_TIME}
              .minValue=${MIN_TRAJECTORY_PREDICTION_TIME}
              .unit=${TRAJECTORY_PREDICTION_TIME_UNIT}
              setting="trajectoryPredictionTime"
            ></setting-range>
          </setting-item>
        </div>
        <div class="group">
          <div class="group-head">
            <h4
              data-tip="Execute callbacks when the user is ${settings.tabOffset} tabbable elements away from registered elements in tab direction"
            >
              Tab prediction
            </h4>
            <setting-toggle
              .isChecked=${settings.enableTabPrediction}
              setting="enableTabPrediction"
            ></setting-toggle>
          </div>
          <setting-item
            header="Tab offset"
            description="Number of tabbable elements to look ahead when predicting navigation"
            ?dimmed=${!settings.enableTabPrediction}
          >
            <setting-range
              slot="controls"
              .currentValue=${settings.tabOffset}
              .maxValue=${MAX_TAB_OFFSET}
              .minValue=${MIN_TAB_OFFSET}
              .unit=${TAB_OFFSET_UNIT}
              setting="tabOffset"
            ></setting-range>
          </setting-item>
        </div>
        <div class="group">
          <div class="group-head">
            <h4
              data-tip="Execute callbacks when the user is ${settings.scrollMargin}px away from registered elements in scroll direction"
            >
              Scroll prediction
            </h4>
            <setting-toggle
              .isChecked=${settings.enableScrollPrediction}
              setting="enableScrollPrediction"
            ></setting-toggle>
          </div>
          <setting-item
            header="Scroll margin"
            description="Pixel distance to check from the mouse position in scroll direction"
            ?dimmed=${!settings.enableScrollPrediction}
          >
            <setting-range
              slot="controls"
              .currentValue=${settings.scrollMargin}
              .maxValue=${MAX_SCROLL_MARGIN}
              .minValue=${MIN_SCROLL_MARGIN}
              .unit=${SCROLL_MARGIN_UNIT}
              setting="scrollMargin"
            ></setting-range>
          </setting-item>
        </div>
        <div class="group">
          <div class="group-head"><h4>Device</h4></div>
          <setting-item
            header="Touch strategy"
            description="How to handle prediction on touch devices"
          >
            <single-select-dropdown
              slot="controls"
              .dropdownOptions=${this.touchDeviceStrategyOptions}
              .selectedOptionValue=${settings.touchDeviceStrategy}
              .onSelectionChange=${this._handleTouchDeviceStrategyChange}
            ></single-select-dropdown>
          </setting-item>
          <setting-item
            header="Minimum connection"
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

        <div class="group">
          <div class="group-head"><h4>Devtools</h4></div>
          <setting-item
            header="Name tags"
            description="Display name tags over each registered element"
          >
            <setting-toggle
              slot="controls"
              .isChecked=${this.devtoolsSettings.show.nameTags}
              setting="show.nameTags"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item
            header="Element overlays"
            description="Render hit-slop boundary overlays around registered elements. Turning this off also hides name tags."
          >
            <setting-toggle
              slot="controls"
              .isChecked=${this.devtoolsSettings.show.elementOverlays}
              setting="show.elementOverlays"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item
            header="Mouse trajectory"
            description="Render the predicted mouse trajectory line"
          >
            <setting-toggle
              slot="controls"
              .isChecked=${this.devtoolsSettings.show.mouseTrajectory}
              setting="show.mouseTrajectory"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item
            header="Scroll trajectory"
            description="Render the predicted scroll trajectory line"
          >
            <setting-toggle
              slot="controls"
              .isChecked=${this.devtoolsSettings.show.scrollTrajectory}
              setting="show.scrollTrajectory"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item
            header="Panel position"
            description="Which corner the control panel sits in"
          >
            <single-select-dropdown
              slot="controls"
              .dropdownOptions=${this.cornerOptions}
              .selectedOptionValue=${this.currentCorner}
              .onSelectionChange=${this._handleCornerChange}
            ></single-select-dropdown>
          </setting-item>
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
