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
import "../copy-button"
import "./setting-item/setting-toggle"
import "./setting-item/setting-range"
import "./setting-item/setting-item"
import "../dropdown/single-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
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
      padding-bottom: 6px;
    }

    .group-head {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 24px;
      padding: 0 10px;
    }

    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      margin: 0;
      color: var(--tint, var(--fs-muted));
      font-size: inherit;
      font-weight: 500;
      cursor: default;
    }

    single-select-dropdown {
      margin-right: -5px;
    }

    h4::after {
      content: "";
      flex: 1;
      border-top: 1px dashed var(--fs-line);
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
  private touchDeviceStrategyOptions: DropdownOption[] = [
    { value: "onTouchStart", title: "Fire callbacks the moment a finger lands on the element" },
    { value: "viewport", title: "Fire callbacks as soon as the element scrolls into view" },
    { value: "none", title: "No prediction on touch devices" },
  ]

  private minimumConnectionTypeOptions: DropdownOption[] = [
    { value: "slow-2g", title: "Prefetch on anything, even slow-2g" },
    { value: "2g", title: "Skip prefetching below 2g" },
    { value: "3g", title: "Skip prefetching below 3g" },
    { value: "4g", title: "Only prefetch on 4g" },
  ]

  private cornerOptions: DropdownOption[] = [
    { value: "top-left", title: "Dock the panel top left" },
    { value: "top-right", title: "Dock the panel top right" },
    { value: "bottom-left", title: "Dock the panel bottom left" },
    { value: "bottom-right", title: "Dock the panel bottom right" },
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
    const settings = this.managerSettings
    const show = this.devtoolsSettings.show
    const changes = this.changedSettings

    const changedTip =
      "Changed since page load. Copy the config to keep them.\n\n" +
      changes
        .map(
          change =>
            `${change.setting}: ${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`
        )
        .join("\n")

    return html`
      <tab-header>
        ${
          changes.length
            ? html`<span slot="chips" title=${changedTip}>${changes.length} changed</span>`
            : ""
        }
        <div slot="actions">
          <copy-button
            label="copy config"
            title="Copy as ForesightManager.initialize({...})"
            .onCopy=${() => this.handleCopySettings()}
          ></copy-button>
        </div>
      </tab-header>

      <tab-content>
        <div class="group" style="--tint: var(--fs-mouse)">
          <div class="group-head">
            <h4
              title="Fire callbacks when the cursor is heading for an element and will reach it within ${settings.trajectoryPredictionTime}ms"
            >
              mouse
            </h4>
            <setting-toggle
              title="enableMousePrediction"
              .isChecked=${settings.enableMousePrediction}
              setting="enableMousePrediction"
            ></setting-toggle>
          </div>
          <setting-item
            header="trajectoryPredictionTime"
            description="How far ahead the cursor path is projected"
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
        <div class="group" style="--tint: var(--fs-tab)">
          <div class="group-head">
            <h4
              title="Fire callbacks when keyboard focus is ${settings.tabOffset} tab stops away from an element"
            >
              tab
            </h4>
            <setting-toggle
              title="enableTabPrediction"
              .isChecked=${settings.enableTabPrediction}
              setting="enableTabPrediction"
            ></setting-toggle>
          </div>
          <setting-item
            header="tabOffset"
            description="How many tab stops ahead to look"
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
        <div class="group" style="--tint: var(--fs-scroll)">
          <div class="group-head">
            <h4
              title="Fire callbacks for elements within ${settings.scrollMargin}px of the cursor in the direction you scroll"
            >
              scroll
            </h4>
            <setting-toggle
              title="enableScrollPrediction"
              .isChecked=${settings.enableScrollPrediction}
              setting="enableScrollPrediction"
            ></setting-toggle>
          </div>
          <setting-item
            header="scrollMargin"
            description="How far past the cursor to look in the scroll direction"
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
          <div class="group-head"><h4>device</h4></div>
          <setting-item
            header="touchDeviceStrategy"
            description="What replaces mouse prediction on touch screens"
          >
            <single-select-dropdown
              slot="controls"
              .dropdownOptions=${this.touchDeviceStrategyOptions}
              .selectedOptionValue=${settings.touchDeviceStrategy}
              .onSelectionChange=${this._handleTouchDeviceStrategyChange}
            ></single-select-dropdown>
          </setting-item>
          <setting-item
            header="minimumConnectionType"
            description="Slower connections than this skip registration entirely"
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
          <div class="group-head"><h4>devtools</h4></div>
          <setting-item
            header="show.elementOverlays"
            description="Dashed hit-slop boxes around elements. Off also hides name tags"
          >
            <setting-toggle
              slot="controls"
              .isChecked=${show.elementOverlays}
              setting="show.elementOverlays"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item header="show.nameTags" description="Element name above each overlay">
            <setting-toggle
              slot="controls"
              .isChecked=${show.nameTags}
              setting="show.nameTags"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item header="show.mouseTrajectory" description="The projected cursor path">
            <setting-toggle
              slot="controls"
              .isChecked=${show.mouseTrajectory}
              setting="show.mouseTrajectory"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item header="show.scrollTrajectory" description="The projected scroll path">
            <setting-toggle
              slot="controls"
              .isChecked=${show.scrollTrajectory}
              setting="show.scrollTrajectory"
              @setting-changed=${this._handleDevtoolsSettingChange}
            ></setting-toggle>
          </setting-item>
          <setting-item header="corner" description="Where this panel docks. Saved in localStorage">
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
