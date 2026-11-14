import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("setting-item")
export class SettingItem extends LitElement {
  static styles = [
    css`
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 28px;
        padding: 0 6px;
        border-radius: 4px;
      }

      .row:hover {
        background: var(--fs-surface);
      }

      :host([dimmed]) .row {
        opacity: 0.4;
      }

      .label {
        color: var(--fs-text);
        font-size: 12px;
        cursor: default;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
    `,
  ]

  @property({ type: String }) header: string = ""
  @property({ type: String }) description: string = ""
  @property({ type: Boolean, reflect: true }) dimmed: boolean = false

  render() {
    return html`<div class="row" data-tip=${this.description}>
      <span class="label">${this.header}</span>
      <div class="controls"><slot name="controls"></slot></div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-item": SettingItem
  }
}
