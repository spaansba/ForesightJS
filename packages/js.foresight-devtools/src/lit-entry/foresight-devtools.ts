import { LitElement, css, html } from "lit"
import { customElement } from "lit/decorators.js"

import "./control-panel/control-panel"
import "./debug-overlay/debug-overlay"
@customElement("foresight-devtools")
export class ForesightDevtools extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ]

  render() {
    return html`<control-panel></control-panel> <debug-overlay></debug-overlay>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "foresight-devtools": ForesightDevtools
  }
}
