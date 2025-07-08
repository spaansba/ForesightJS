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
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        background-color: rgba(255, 255, 255, 0.05);
        color: #e8e8e8;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        white-space: nowrap;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
        letter-spacing: 0.02em;
        line-height: 1.2;
        transition: all 0.2s ease;
      }

      .chip:hover {
        background-color: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
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
