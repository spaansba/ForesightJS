import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("tab-content")
export class TabContent extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        flex: 1;
        min-height: 0;
      }

      .content {
        height: 100%;
        box-sizing: border-box;
        padding: 4px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
      }

      .empty {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding: 0 24px;
        text-align: center;
        color: var(--fs-muted);
      }
    `,
  ]

  @property({ type: String, attribute: "no-content-message" })
  noContentMessage: string = "No content available."

  @property({ type: Boolean })
  hasContent: boolean = true

  render() {
    return html`
      <div class="content">
        ${
          this.hasContent
            ? html`<slot></slot>`
            : html`<div class="empty">${this.noContentMessage}</div>`
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tab-content": TabContent
  }
}
