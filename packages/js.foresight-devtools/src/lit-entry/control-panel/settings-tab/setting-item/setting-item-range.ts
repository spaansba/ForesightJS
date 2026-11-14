import { LitElement, html, css, type PropertyValues } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import "./setting-item"
import { ForesightManager, type ForesightManagerSettings } from "js.foresight"
@customElement("setting-item-range")
export class SettingItemRange extends LitElement {
  static styles = [
    css`
      .range {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .value {
        min-width: 44px;
        text-align: right;
        color: var(--fs-muted);
        font-family: var(--fs-mono);
        font-size: 10.5px;
      }

      input {
        appearance: none;
        width: 96px;
        height: 14px;
        margin: 0;
        background: transparent;
        cursor: pointer;
      }

      input::-webkit-slider-runnable-track {
        height: 3px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.14);
      }

      input::-moz-range-track {
        height: 3px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.14);
      }

      input::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        margin-top: -4.5px;
        border: none;
        border-radius: 50%;
        background: var(--fs-accent);
      }

      input::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border: none;
        border-radius: 50%;
        background: var(--fs-accent);
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

  willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties)
    if (changedProperties.has("currentValue")) {
      this.displayValue = this.currentValue
    }
  }

  render() {
    return html`<setting-item header=${this.header} description=${this.description}>
      <div slot="controls" class="range">
        <input
          type="range"
          min="${this.minValue}"
          max="${this.maxValue}"
          step="1"
          .value=${this.displayValue}
          @input=${this.handleRangeInput}
          @change=${this.handleRangeChange}
        />
        <span class="value">${this.displayValue} ${this.unit}</span>
      </div>
    </setting-item>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-item-range": SettingItemRange
  }
}
