import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import "./setting-item"
import { ForesightManager, type ForesightManagerSettings } from "js.foresight"
@customElement("setting-item-range")
export class SettingItemRange extends LitElement {
  static styles = [
    css`
      .setting-range-value {
        font-size: 12px;
        color: #b0c4de;
        font-weight: 500;
        min-width: 45px;
        text-align: right;
      }

      .range-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

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
    `,
  ]

  @property({ type: Number }) minValue: number = 0
  @property({ type: Number }) maxValue: number = 100
  @property({ type: Number }) currentValue: number = 50
  @property({ type: String }) unit: string = "px"
  @property({ type: String }) header: string = ""
  @property({ type: String }) description: string = ""
  @property({ type: String }) setting: keyof ForesightManagerSettings = "tabOffset"

  @state() private displayValue: number = 50

  private handleRangeInput(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      this.displayValue = parseInt(target.value, 10)
    }
  }

  private handleRangeChange(event: Event): void {
    const target = event.target
    if (target instanceof HTMLInputElement) {
      const value = parseInt(target.value, 10)
      this.displayValue = value
      ForesightManager.instance.alterGlobalSettings({
        [this.setting]: value,
      })
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties)
    if (changedProperties.has("currentValue")) {
      this.displayValue = this.currentValue
    }
  }

  render() {
    return html`<setting-item header=${this.header} description=${this.description}>
      <div slot="controls" class="range-wrapper">
        <input
          slot="controls"
          type="range"
          min="${this.minValue}"
          max="${this.maxValue}"
          step="1"
          .value=${this.displayValue}
          @input=${this.handleRangeInput}
          @change=${this.handleRangeChange}
        />
        <span class="setting-range-value">${this.displayValue} ${this.unit}</span>
      </div>
    </setting-item>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-item-range": SettingItemRange
  }
}
