import { LitElement, html, css, type PropertyValues } from "lit"
import { customElement, property, state } from "lit/decorators.js"

import { ForesightManager, type ForesightManagerSettings } from "js.foresight"
@customElement("setting-range")
export class SettingRange extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .value {
        min-width: 48px;
        text-align: right;
        color: var(--fs-text);
        font-family: var(--fs-mono);
        font-size: 10.5px;
      }

      input {
        appearance: none;
        width: 110px;
        height: 14px;
        margin: 0;
        background: transparent;
        cursor: pointer;
      }

      input::-webkit-slider-runnable-track {
        height: 3px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--fs-accent) var(--fill),
          rgba(255, 255, 255, 0.14) var(--fill)
        );
      }

      input::-moz-range-track {
        height: 3px;
        border-radius: 2px;
        background: linear-gradient(
          to right,
          var(--fs-accent) var(--fill),
          rgba(255, 255, 255, 0.14) var(--fill)
        );
      }

      input::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        margin-top: -4.5px;
        border: none;
        border-radius: 2px;
        background: #fff;
      }

      input::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border: none;
        border-radius: 2px;
        background: #fff;
      }
    `,
  ]

  @property({ type: Number }) minValue: number = 0
  @property({ type: Number }) maxValue: number = 100
  @property({ type: Number }) currentValue: number = 50
  @property({ type: String }) unit: string = "px"
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
    const fill = ((this.displayValue - this.minValue) / (this.maxValue - this.minValue)) * 100

    return html`<input
        type="range"
        min="${this.minValue}"
        max="${this.maxValue}"
        step="1"
        style="--fill: ${fill}%"
        .value=${this.displayValue}
        @input=${this.handleRangeInput}
        @change=${this.handleRangeChange}
      />
      <span class="value">${this.displayValue} ${this.unit}</span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-range": SettingRange
  }
}
