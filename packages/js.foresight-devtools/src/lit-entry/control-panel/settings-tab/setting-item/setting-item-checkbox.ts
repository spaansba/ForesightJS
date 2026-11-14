import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

import "./setting-item"
import { ForesightManager, type ForesightManagerSettings } from "js.foresight"
import type { DevtoolsSettings, ShowKey } from "../../../../types/types"

type ShowSettingKey = `show.${ShowKey}`
@customElement("setting-item-checkbox")
export class SettingItemCheckbox extends LitElement {
  static styles = [
    css`
      input {
        appearance: none;
        position: relative;
        width: 26px;
        height: 14px;
        margin: 0;
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.14);
        cursor: pointer;
        outline: none;
        transition: background-color 0.15s ease;
      }

      input::before {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.15s ease;
      }

      input:checked {
        background: var(--fs-accent);
      }

      input:checked::before {
        transform: translateX(12px);
      }

      input:focus-visible {
        outline: 1px solid var(--fs-accent);
        outline-offset: 2px;
      }
    `,
  ]

  @property({ type: Boolean }) isChecked: boolean = false
  @property({ type: String }) header: string = ""
  @property({ type: String }) description: string = ""
  @property({ type: String }) setting:
    keyof ForesightManagerSettings | keyof DevtoolsSettings | ShowSettingKey =
    "enableMousePrediction"

  private handleCheckboxChange(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      const targetIsChecked = target.checked

      if (String(this.setting).startsWith("show.")) {
        this.dispatchEvent(
          new CustomEvent("setting-changed", {
            detail: { setting: this.setting, value: targetIsChecked },
            bubbles: true,
          })
        )
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
