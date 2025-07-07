import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("chip-element")
export class ChipElement extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-block;
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
    `,
  ]

  @property({ type: String }) title: string = ""

  render() {
    return html`
      <span class="chip" title="${this.title}">
        <slot></slot>
      </span>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "chip-element": ChipElement
  }
}
