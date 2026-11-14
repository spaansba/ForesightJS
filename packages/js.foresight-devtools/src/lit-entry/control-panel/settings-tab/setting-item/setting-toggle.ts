import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

import { ForesightManager, type ForesightManagerSettings } from "js.foresight"
import type { DevtoolsSettings, ShowKey } from "../../../../types/types"

type ShowSettingKey = `show.${ShowKey}`
@customElement("setting-toggle")
export class SettingToggle extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-flex;
      }

      input {
        appearance: none;
        position: relative;
        width: 26px;
        height: 14px;
        margin: 0;
        border-radius: 4px;
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
        border-radius: 2px;
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
    return html`<input
      type="checkbox"
      .checked=${this.isChecked}
      @change=${this.handleCheckboxChange}
    />`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-toggle": SettingToggle
  }
}
