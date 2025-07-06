import type { ForesightManagerSettings, UpdateForsightManagerSettings } from "js.foresight"
import { ForesightManager } from "js.foresight"
import { BaseTab } from "../baseTab/BaseTab"
import type { ForesightDebugger } from "../../debugger/ForesightDebugger"
import { createAndAppendStyle } from "../../debugger/helpers/createAndAppend"

import type { DebuggerBooleanSettingKeys, DebuggerSettings } from "../../types/types"
import type { ManagerBooleanSettingKeys, NumericSettingKeys } from "js.foresight/types/types"
import { objectToMethodCall } from "./helpers/objectToMethodCall"
import {
  POSITION_HISTORY_SIZE_UNIT,
  SCROLL_MARGIN_UNIT,
  TAB_OFFSET_UNIT,
  TRAJECTORY_PREDICTION_TIME_UNIT,
} from "../../constants"
import { queryAndAssert } from "../../debugger/helpers/queryAndAssert"
const COPY_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
const TICK_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

/**
 * ControlPanelSettingsTab manages all settings-related functionality for the debugger control panel.
 * It handles form controls, settings updates, and provides a comprehensive interface
 * for configuring ForesightJS manager and debugger settings in real-time.
 */
export class ControlPanelSettingsTab extends BaseTab {
  // Settings form controls
  private trajectoryEnabledCheckbox: HTMLInputElement | null = null
  private tabEnabledCheckbox: HTMLInputElement | null = null
  private scrollEnabledCheckbox: HTMLInputElement | null = null
  private historySizeSlider: HTMLInputElement | null = null
  private historyValueSpan: HTMLSpanElement | null = null
  private predictionTimeSlider: HTMLInputElement | null = null
  private predictionValueSpan: HTMLSpanElement | null = null
  private tabOffsetSlider: HTMLInputElement | null = null
  private tabOffsetValueSpan: HTMLSpanElement | null = null
  private scrollMarginSlider: HTMLInputElement | null = null
  private scrollMarginValueSpan: HTMLSpanElement | null = null
  private showNameTagsCheckbox: HTMLInputElement | null = null

  // Settings tab specific controls
  private copySettingsButton: HTMLButtonElement | null = null
  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null
  private settingsStyleElement: HTMLStyleElement | null = null

  constructor(
    foresightManager: ForesightManager,
    debuggerInstance: ForesightDebugger,
    controlsContainer: HTMLDivElement,
    shadowRoot: ShadowRoot
  ) {
    super(foresightManager, debuggerInstance, controlsContainer)

    if (shadowRoot) {
      this.settingsStyleElement = createAndAppendStyle(
        this.getSettingsStyles(),
        shadowRoot,
        "debug-control-panel-settings"
      )
    }
    this.queryDOMElements()
    this.setupEventListeners()
  }

  public cleanup(): void {
    this.settingsStyleElement?.remove()

    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId)
      this.copyTimeoutId = null
    }

    // Nullify all settings-related properties
    this.trajectoryEnabledCheckbox = null
    this.tabEnabledCheckbox = null
    this.scrollEnabledCheckbox = null
    this.historySizeSlider = null
    this.historyValueSpan = null
    this.predictionTimeSlider = null
    this.predictionValueSpan = null
    this.tabOffsetSlider = null
    this.tabOffsetValueSpan = null
    this.scrollMarginSlider = null
    this.scrollMarginValueSpan = null
    this.showNameTagsCheckbox = null
    this.copySettingsButton = null
    this.settingsStyleElement = null
  }

  protected queryDOMElements(): void {
    const controlsContainer = this.controlsContainer
    this.trajectoryEnabledCheckbox = queryAndAssert("#trajectory-enabled", controlsContainer)
    this.tabEnabledCheckbox = queryAndAssert("#tab-enabled", controlsContainer)
    this.scrollEnabledCheckbox = queryAndAssert("#scroll-enabled", controlsContainer)
    this.historySizeSlider = queryAndAssert("#history-size", controlsContainer)
    this.historyValueSpan = queryAndAssert("#history-value", controlsContainer)
    this.predictionTimeSlider = queryAndAssert("#prediction-time", controlsContainer)
    this.predictionValueSpan = queryAndAssert("#prediction-value", controlsContainer)
    this.tabOffsetSlider = queryAndAssert("#tab-offset", controlsContainer)
    this.tabOffsetValueSpan = queryAndAssert("#tab-offset-value", controlsContainer)
    this.scrollMarginSlider = queryAndAssert("#scroll-margin", controlsContainer)
    this.scrollMarginValueSpan = queryAndAssert("#scroll-margin-value", controlsContainer)
    this.showNameTagsCheckbox = queryAndAssert("#toggle-name-tags", controlsContainer)
  }

  protected setupEventListeners(): void {
    this.createChangeEventListener(this.trajectoryEnabledCheckbox, "enableMousePrediction")
    this.createChangeEventListener(this.tabEnabledCheckbox, "enableTabPrediction")
    this.createChangeEventListener(this.scrollEnabledCheckbox, "enableScrollPrediction")
    this.createChangeEventListener(this.showNameTagsCheckbox, "showNameTags")

    this.createInputEventListener(
      this.historySizeSlider,
      this.historyValueSpan,
      POSITION_HISTORY_SIZE_UNIT,
      "positionHistorySize"
    )

    this.createInputEventListener(
      this.predictionTimeSlider,
      this.predictionValueSpan,
      TRAJECTORY_PREDICTION_TIME_UNIT,
      "trajectoryPredictionTime"
    )

    this.createInputEventListener(
      this.tabOffsetSlider,
      this.tabOffsetValueSpan,
      TAB_OFFSET_UNIT,
      "tabOffset"
    )

    this.createInputEventListener(
      this.scrollMarginSlider,
      this.scrollMarginValueSpan,
      SCROLL_MARGIN_UNIT,
      "scrollMargin"
    )

    this.copySettingsButton = queryAndAssert("#copy-settings", this.controlsContainer)
    this.copySettingsButton?.addEventListener("click", this.handleCopySettings.bind(this))
  }

  public updateControlsState(
    managerSettings: ForesightManagerSettings,
    debuggerSettings: DebuggerSettings
  ): void {
    if (this.trajectoryEnabledCheckbox) {
      this.trajectoryEnabledCheckbox.checked = managerSettings.enableMousePrediction
    }
    if (this.tabEnabledCheckbox) {
      this.tabEnabledCheckbox.checked = managerSettings.enableTabPrediction
    }
    if (this.scrollEnabledCheckbox) {
      this.scrollEnabledCheckbox.checked = managerSettings.enableScrollPrediction
    }
    if (this.showNameTagsCheckbox) {
      this.showNameTagsCheckbox.checked = debuggerSettings.showNameTags
    }
    if (this.historySizeSlider && this.historyValueSpan) {
      this.historySizeSlider.value = managerSettings.positionHistorySize.toString()
      this.historyValueSpan.textContent = `${managerSettings.positionHistorySize} ${POSITION_HISTORY_SIZE_UNIT}`
    }
    if (this.predictionTimeSlider && this.predictionValueSpan) {
      this.predictionTimeSlider.value = managerSettings.trajectoryPredictionTime.toString()
      this.predictionValueSpan.textContent = `${managerSettings.trajectoryPredictionTime} ${TRAJECTORY_PREDICTION_TIME_UNIT}`
    }
    if (this.tabOffsetSlider && this.tabOffsetValueSpan) {
      this.tabOffsetSlider.value = managerSettings.tabOffset.toString()
      this.tabOffsetValueSpan.textContent = `${managerSettings.tabOffset} ${TAB_OFFSET_UNIT}`
    }
    if (this.scrollMarginSlider && this.scrollMarginValueSpan) {
      this.scrollMarginSlider.value = managerSettings.scrollMargin.toString()
      this.scrollMarginValueSpan.textContent = `${managerSettings.scrollMargin} ${SCROLL_MARGIN_UNIT}`
    }
  }

  private handleCopySettings(): void {
    if (!this.copySettingsButton) return
    navigator.clipboard
      .writeText(
        objectToMethodCall(
          this.foresightManagerInstance.getManagerData.globalSettings,
          "ForesightManager.initialize"
        )
      )
      .then(() => {
        this.copySettingsButton!.innerHTML = TICK_SVG_ICON
        if (this.copyTimeoutId) {
          clearTimeout(this.copyTimeoutId)
        }
        this.copyTimeoutId = setTimeout(() => {
          if (this.copySettingsButton) {
            this.copySettingsButton.innerHTML = COPY_SVG_ICON
          }
          this.copyTimeoutId = null
        }, 500)
      })
      .catch(err => {
        console.error("Foresight Debugger: Could not copy manager settings to clipboard", err)
      })
  }

  private createInputEventListener(
    element: HTMLInputElement | null,
    spanElement: HTMLSpanElement | null,
    unit: string,
    setting: NumericSettingKeys
  ): void {
    if (!element || !spanElement) {
      return
    }
    element.addEventListener("input", e => {
      const value = parseInt((e.target as HTMLInputElement).value, 10)
      spanElement.textContent = `${value} ${unit}`
      this.foresightManagerInstance.alterGlobalSettings({
        [setting]: value,
      })
    })
  }

  private createChangeEventListener(
    element: HTMLElement | null,
    setting: ManagerBooleanSettingKeys | DebuggerBooleanSettingKeys
  ): void {
    if (!element) {
      return
    }

    const debuggerSettings = this.debuggerInstance.getDebuggerData.settings

    element.addEventListener("change", e => {
      const isChecked = (e.target as HTMLInputElement).checked

      if (setting in debuggerSettings) {
        this.debuggerInstance.alterDebuggerSettings({
          [setting]: isChecked,
        } as Partial<DebuggerSettings>)
      } else {
        this.foresightManagerInstance.alterGlobalSettings({
          [setting]: isChecked,
        } as Partial<UpdateForsightManagerSettings>)
      }
    })
  }

  public getSettingsStyles(): string {
    return /* css */ `
      .settings-content {
        display: block;
      }

      /* Settings Tab Styles */
      .settings-section {
        
      }
      
      .settings-group {
        margin-bottom: 20px;
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
      #debug-controls input[type="checkbox"] {
        appearance: none; -webkit-appearance: none; -moz-appearance: none;
        position: relative; width: 44px; height: 22px;
        background-color: #444; cursor: pointer;
        outline: none; transition: all 0.3s ease;
        vertical-align: middle; flex-shrink: 0; margin: 0;
        border: 2px solid #555;
      }
      
      #debug-controls input[type="checkbox"]::before {
        content: ""; position: absolute; width: 16px; height: 16px;
        background-color: white; top: 1px; left: 1px;
        transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      #debug-controls input[type="checkbox"]:checked {
        background-color: #b0c4de;
        border-color: #b0c4de;
      }
      
      #debug-controls input[type="checkbox"]:checked::before {
        transform: translateX(22px);
        background-color: white;
      }
      
      #debug-controls input[type="checkbox"]:hover {
        box-shadow: 0 0 0 3px rgba(176, 196, 222, 0.1);
      }

      /* Modern Range Sliders */
      #debug-controls input[type="range"] {
        margin: 0; cursor: pointer; -webkit-appearance: none;
        appearance: none; background: transparent; height: 22px; vertical-align: middle;
        width: 100px;
      }
      
      #debug-controls input[type="range"]::-webkit-slider-runnable-track {
        height: 6px; background: #444; border-radius: 3px;
        border: 1px solid #555;
      }
      
      #debug-controls input[type="range"]::-moz-range-track {
        height: 6px; background: #444; border-radius: 3px;
        border: 1px solid #555;
      }
      
      #debug-controls input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; margin-top: -7px;
        background: #b0c4de; height: 20px; width: 20px;
        border-radius: 50%; border: 2px solid #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      }
      
      #debug-controls input[type="range"]::-moz-range-thumb {
        background: #b0c4de; height: 20px; width: 20px;
        border-radius: 50%; border: 2px solid #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      }
      
      #debug-controls input[type="range"]:hover::-webkit-slider-thumb {
        transform: scale(1.1);
        box-shadow: 0 0 0 4px rgba(176, 196, 222, 0.2);
      }
      
      #debug-controls input[type="range"]:hover::-moz-range-thumb {
        transform: scale(1.1);
        box-shadow: 0 0 0 4px rgba(176, 196, 222, 0.2);
      }
    `
  }
}
