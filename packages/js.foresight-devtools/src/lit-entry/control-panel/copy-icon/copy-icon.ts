import { LitElement, html, css } from "lit"
import { customElement, property, state } from "lit/decorators.js"
import { COPY_SVG, TICK_SVG } from "../../../svg/svg-icons"
import { iconButtonStyles } from "../shared-styles"

@customElement("copy-icon")
export class CopyIcon extends LitElement {
  static styles = [
    iconButtonStyles,
    css`
      :host {
        display: inline-flex;
      }

      .copied {
        color: #66bb6a;
      }

      .copied:hover {
        color: #66bb6a;
      }
    `,
  ]

  @property({ type: Function }) onCopy?: (event: MouseEvent) => Promise<void> | void

  @state() private isCopied: boolean = false
  @state() private copyTimeout: ReturnType<typeof setTimeout> | null = null

  private async handleClick(event: MouseEvent): Promise<void> {
    if (this.isCopied) {
      return
    }

    if (this.onCopy) {
      try {
        await this.onCopy(event)
      } catch (error) {
        console.error("Error in onCopy function:", error)
      }
    }

    this.isCopied = true

    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout)
    }

    this.copyTimeout = setTimeout(() => {
      this.isCopied = false
      this.copyTimeout = null
    }, 2000)
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
      <button class="icon-button ${this.isCopied ? "copied" : ""}" @click=${this.handleClick}>
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
