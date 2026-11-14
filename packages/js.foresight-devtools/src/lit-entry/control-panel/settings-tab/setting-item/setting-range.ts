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
        min-width: 52px;
        text-align: right;
        color: var(--fs-text);
      }

      .unit {
        margin-left: 2px;
        color: var(--fs-muted);
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
        height: 1px;
        background: linear-gradient(
          to right,
          var(--tint, var(--fs-text)) var(--fill),
          var(--fs-dim) var(--fill)
        );
      }

      input::-moz-range-track {
        height: 1px;
        background: linear-gradient(
          to right,
          var(--tint, var(--fs-text)) var(--fill),
          var(--fs-dim) var(--fill)
        );
      }

      input::-webkit-slider-thumb {
        appearance: none;
        width: 3px;
        height: 12px;
        margin-top: -5.5px;
        border: none;
        border-radius: 0;
        background: var(--fs-text);
      }

      input::-moz-range-thumb {
        width: 3px;
        height: 12px;
        border: none;
        border-radius: 0;
        background: var(--fs-text);
      }

      input:focus-visible {
        outline: 1px dashed var(--fs-text);
        outline-offset: 2px;
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
      <span class="value">${this.displayValue}<span class="unit">${this.unit}</span></span>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-range": SettingRange
  }
}
