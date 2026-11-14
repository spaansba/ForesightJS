import { LitElement, html, css } from "lit"
import { customElement } from "lit/decorators.js"

@customElement("tab-header")
export class TabHeader extends LitElement {
  static styles = [
    css`
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        height: 30px;
        padding: 0 6px 0 10px;
        border-bottom: 1px solid var(--fs-border);
        flex-shrink: 0;
      }

      .chips,
      .actions,
      ::slotted(*) {
        display: flex;
        align-items: center;
        gap: 2px;
      }
    `,
  ]

  render() {
    return html`
      <div class="toolbar">
        <div class="chips"><slot name="chips"></slot></div>
        <div class="actions"><slot name="actions"></slot></div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tab-header": TabHeader
  }
}
