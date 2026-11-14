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
        height: 28px;
        padding: 0 5px 0 10px;
        border-bottom: 1px solid var(--fs-line);
        flex-shrink: 0;
      }

      ::slotted([slot="chips"]) {
        color: var(--fs-muted);
        white-space: nowrap;
        cursor: default;
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
