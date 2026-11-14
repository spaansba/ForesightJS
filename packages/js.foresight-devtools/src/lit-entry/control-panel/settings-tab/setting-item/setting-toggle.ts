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
        width: 11px;
        height: 11px;
        margin: 0;
        border: 1px solid var(--fs-muted);
        background: transparent;
        cursor: pointer;
      }

      input:checked {
        border-color: var(--tint, var(--fs-text));
        background: var(--tint, var(--fs-text));
        box-shadow: inset 0 0 0 2px var(--fs-bg);
      }

      input:focus-visible {
        outline: 1px dashed var(--fs-text);
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
