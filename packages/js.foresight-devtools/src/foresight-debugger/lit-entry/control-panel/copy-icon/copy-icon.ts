import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { COPY_SVG, TICK_SVG } from "../../../svg/svg-icons"

@customElement("copy-icon")
export class CopyIcon extends LitElement {
  static styles = css`
    .copy-button {
      background: transparent;
      border: 0px;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s ease, background-color 0.2s ease;
    }

    :host([positioned]) .copy-button {
      position: absolute;
      top: 10px;
      right: 1px;
    }

    .copy-button:hover {
      background-color: rgba(176, 196, 222, 0.1);
    }

    .copy-button:hover svg {
      stroke: #b0c4de;
    }

    .copy-button svg {
      width: 14px;
      height: 14px;
      stroke: #ddd;
      stroke-width: 2.5;
    }

    .copy-button.copied svg {
      stroke: #4caf50; /* Green tick */
    }
  `

  @property({ type: String }) title: string = "Copy to clipboard"
  @property({ type: Function }) onCopy?: (event: MouseEvent) => Promise<void> | void

  @state() private isCopied: boolean = false
  @state() private copyTimeout: ReturnType<typeof setTimeout> | null = null

  private async handleClick(event: MouseEvent): Promise<void> {
    if (this.isCopied) return

    if (this.onCopy) {
      await this.onCopy(event)
    }

    this.isCopied = true

    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout)
    }

    this.copyTimeout = setTimeout(() => {
      this.isCopied = false
      this.copyTimeout = null
    }, 500)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout)
      this.copyTimeout = null
    }
  }

  render() {
    return html`
      <button
        class="copy-button ${this.isCopied ? "copied" : ""}"
        title="${this.title}"
        @click=${this.handleClick}
      >
        ${this.isCopied ? TICK_SVG : COPY_SVG}
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "copy-icon": CopyIcon
  }
}
