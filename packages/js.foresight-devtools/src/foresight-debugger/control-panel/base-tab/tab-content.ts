import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("tab-content")
export class TabContent extends LitElement {
  static styles = [
    css`
      :host {
        height: 285px;
        overflow: hidden;
      }

      .content-container::-webkit-scrollbar {
        width: 8px;
      }

      .content-container::-webkit-scrollbar-track {
        background: rgba(30, 30, 30, 0.5);
      }

      .content-container::-webkit-scrollbar-thumb {
        background-color: rgba(176, 196, 222, 0.5);
        border: 2px solid rgba(0, 0, 0, 0.2);
      }

      .content-container::-webkit-scrollbar-thumb:hover {
        background-color: rgba(176, 196, 222, 0.7);
      }

      .content-container {
        height: 100%;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(176, 196, 222, 0.5) rgba(30, 30, 30, 0.5);
      }

      .no-content-message {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%; /* Ensure it fills the container */
        color: #afafaf; /* A subtle color for the message */
        font-style: italic;
        font-family: "Courier New", monospace;
      }
    `,
  ]

  @property({ type: String, attribute: "no-content-message" })
  noContentMessage: string = "No content available."

  @property({ type: Boolean })
  hasContent: boolean = true

  render() {
    return html`
      <div class="content-container">
        ${this.hasContent
          ? html`<slot></slot>`
          : html`<div class="no-content-message">${this.noContentMessage}</div>`}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "tab-content": TabContent
  }
}
