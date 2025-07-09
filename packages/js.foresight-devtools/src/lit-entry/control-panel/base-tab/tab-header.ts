import { LitElement, html, css } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("tab-header")
export class TabHeader extends LitElement {
  static styles = [
    css`
      :host {
      }
      .tab-bar-info {
        display: flex;
        gap: 12px;
        align-items: center;
        flex: 1;
      }

      .stats-chips {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .chip {
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border: 1px solid #555;
        white-space: nowrap;
        letter-spacing: 0.3px;
        background: rgba(40, 40, 40, 0.7);
        color: #b0c4de;
      }

      .tab-bar-actions {
        display: flex;
        gap: 6px;
        align-items: center;
        position: relative;
        flex-direction: row;
      }
      .tab-bar-elements {
        display: flex;
        justify-content: space-between;
        padding: 4px 0 4px 0;
        border-bottom: 1px solid #444;
        position: sticky;
        top: 0;
        z-index: 5;
        min-height: 36px;
      }
    `,
  ]

  render() {
    return html`
      <div class="tab-bar-elements">
        <div class="tab-bar-info">
          <div class="stats-chips">
            <slot name="chips"></slot>
          </div>
        </div>
        <div class="tab-bar-actions">
          <slot name="actions"></slot>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tab-header": TabHeader
  }
}
