import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("setting-item")
export class SettingItem extends LitElement {
  static styles = [
    css`
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
      .setting-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .setting-description {
        font-size: 11px;
        color: #9e9e9e;
        line-height: 1.3;
        font-weight: normal;
      }
      .setting-item label {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-weight: 500;
        color: #fff;
        font-size: 13px;
        min-width: 180px;
      }
      .setting-header {
        font-weight: 500;
        color: #fff;
        font-size: 13px;
      }
    `,
  ]

  @property({ type: String }) header: string = ""
  @property({ type: String }) description: string = ""

  render() {
    return html`<div class="setting-item">
      <label>
        <span class="setting-header">${this.header}</span>
        <span class="setting-description"> ${this.description} </span>
      </label>
      <div class="setting-controls">
        <slot name="controls"></slot>
      </div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "setting-item": SettingItem
  }
}
