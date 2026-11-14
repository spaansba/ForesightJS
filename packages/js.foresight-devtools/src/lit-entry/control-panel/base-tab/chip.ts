import { LitElement, html, css } from "lit"
import { customElement, property } from "lit/decorators.js"

@customElement("chip-element")
export class ChipElement extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-flex;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        height: 18px;
        padding: 0 6px;
        border-radius: 4px;
        background: var(--fs-surface);
        color: var(--fs-muted);
        font-family: var(--fs-mono);
        font-size: 10.5px;
        white-space: nowrap;
        cursor: default;
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
