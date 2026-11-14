import { LitElement, css, html, type PropertyValues } from "lit"
import { customElement, query, state } from "lit/decorators.js"

const SHOW_DELAY_MS = 150
const GAP = 6
const EDGE = 8

type Tip = { text: string; anchor: DOMRect }

@customElement("panel-tooltip")
export class PanelTooltip extends LitElement {
  static styles = css`
    .tip {
      position: fixed;
      z-index: 10003;
      max-width: 260px;
      padding: 4px 7px;
      border-radius: 2px;
      background: var(--fs-text);
      color: var(--fs-bg);
      font-family: var(--fs-mono);
      font-size: 10.5px;
      line-height: 1.45;
      white-space: pre-line;
      pointer-events: none;
    }
  `

  @state() private tip: Tip | null = null
  @query(".tip") private tipEl!: HTMLElement | null

  private target: HTMLElement | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private abortController: AbortController | null = null

  connectedCallback(): void {
    super.connectedCallback()
    this.abortController = new AbortController()
    const { signal } = this.abortController
    const options = { signal, capture: true }

    document.addEventListener("pointerover", this.handlePointerOver, options)
    document.addEventListener("pointerdown", this.hide, options)
    document.addEventListener("scroll", this.hide, options)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.abortController?.abort()
    clearTimeout(this.timer)
  }

  private handlePointerOver = (event: Event) => {
    const path = event.composedPath()
    const target = path.includes(this.getRootNode())
      ? path.find((node): node is HTMLElement => node instanceof HTMLElement && !!node.dataset.tip)
      : undefined

    if (target === this.target) {
      return
    }

    this.hide()
    if (!target) {
      return
    }

    this.target = target
    this.timer = setTimeout(() => {
      this.tip = { text: target.dataset.tip ?? "", anchor: target.getBoundingClientRect() }
    }, SHOW_DELAY_MS)
  }

  private hide = () => {
    clearTimeout(this.timer)
    this.target = null
    this.tip = null
  }

  protected updated(changed: PropertyValues): void {
    if (!changed.has("tip") || !this.tip || !this.tipEl) {
      return
    }

    const { anchor } = this.tip
    const { width, height } = this.tipEl.getBoundingClientRect()
    const fitsBelow = anchor.bottom + GAP + height <= window.innerHeight - EDGE
    const top = fitsBelow ? anchor.bottom + GAP : anchor.top - GAP - height
    const centered = anchor.left + anchor.width / 2 - width / 2
    const left = Math.min(Math.max(centered, EDGE), window.innerWidth - EDGE - width)

    this.tipEl.style.top = `${top}px`
    this.tipEl.style.left = `${left}px`
  }

  render() {
    return this.tip ? html`<div class="tip" role="tooltip">${this.tip.text}</div>` : ""
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "panel-tooltip": PanelTooltip
  }
}
