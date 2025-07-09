import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import "./setting-item"
import { ForesightManager, type ForesightManagerSettings } from "js.foresight"
import type { DevtoolsSettings } from "../../../../../types/types"
import { ForesightDebuggerLit } from "packages/js.foresight-devtools/src/foresight-debugger/ForesightDebuggerLit"
@customElement("setting-item-checkbox")
export class SettingItemCheckbox extends LitElement {
  static styles = [
    css`
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
    `,
  ]

  @property({ type: Boolean }) isChecked: boolean = false
  @property({ type: String }) header: string = ""
  @property({ type: String }) description: string = ""
  @property({ type: String }) setting: keyof ForesightManagerSettings | keyof DevtoolsSettings =
    "enableMousePrediction"

  private handleCheckboxChange(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      const targetIsChecked = target.checked

      if (this.setting === "showNameTags") {
        // Emit event for devtools settings
        this.dispatchEvent(new CustomEvent('setting-changed', {
          detail: { setting: this.setting, value: targetIsChecked },
          bubbles: true
        }))
      } else {
        ForesightManager.instance.alterGlobalSettings({
          [this.setting]: targetIsChecked,
        })
      }
    }
  }

  render() {
    return html`<setting-item header=${this.header} description=${this.description}>
      <input
        slot="controls"
        type="checkbox"
        .checked=${this.isChecked}
        @change=${this.handleCheckboxChange}
      />
    </setting-item>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-item-checkbox": SettingItemCheckbox
  }
}
