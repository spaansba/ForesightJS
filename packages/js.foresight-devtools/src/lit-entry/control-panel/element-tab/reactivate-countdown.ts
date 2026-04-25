import {
  ForesightManager,
  type ForesightElement,
  type ForesightElementState,
} from "js.foresight"
import { LitElement, css, html } from "lit"
import { customElement, property, state } from "lit/decorators.js"

@customElement("reactivate-countdown")
export class ReactivateCountdown extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-block;
      }

      .reactivate-button {
        all: unset;
        cursor: pointer;
        padding: 2px 4px;
        transition: background-color 0.2s ease;
      }

      .reactivate-button:hover {
        background-color: rgba(255, 165, 0, 0.1);
      }

      .countdown-time {
        color: #ffa726;
        font-weight: 500;
        font-size: 10px;
      }

      .countdown-time.infinity {
        font-size: 12px;
        font-weight: 600;
      }

      .countdown-time.clickable {
        cursor: pointer;
      }
    `,
  ]

  @property({ attribute: false }) element!: ForesightElement
  @property({ attribute: false, hasChanged: () => true }) state!: ForesightElementState
  @state()
  private remainingTime: number = 0

  @state()
  private isCountdownActive: boolean = false

  private intervalId: number | null = null
  private startTime: number = 0
  private lastDisplayedTime: string = ""

  connectedCallback() {
    super.connectedCallback()
    this.checkAndStartCountdown()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.clearCountdown()
  }

  willUpdate(changedProperties: Map<string | number | symbol, unknown>) {
    super.willUpdate(changedProperties)
    if (changedProperties.has("state")) {
      this.checkAndStartCountdown()
    }
  }

  private checkAndStartCountdown() {
    const state = this.state

    if (!state) {
      this.clearCountdown()
      return
    }

    // Show countdown when:
    // 1. Callback is inactive (not currently active)
    // 2. Callback has completed at least once (has lastCompletedAt OR lastInvokedAt)
    // 3. reactivateAfter is not 0 (otherwise instant reactivation)
    const hasCallbackHistory = state.lastCompletedAt || state.lastInvokedAt
    const shouldShowCountdown =
      !state.isActive && hasCallbackHistory && state.reactivateAfter > 0

    if (shouldShowCountdown) {
      this.startCountdown()
    } else {
      this.clearCountdown()
    }
  }

  private startCountdown() {
    this.clearCountdown()

    const state = this.state
    if (!state) {
      return
    }

    this.isCountdownActive = true

    if (state.reactivateAfter === Infinity) {
      this.remainingTime = Infinity
      return
    }

    const reactivateAfter = state.reactivateAfter
    const startTime = state.lastCompletedAt || state.lastInvokedAt

    if (!startTime) {
      // No callback has been invoked yet, don't show countdown
      this.clearCountdown()
      return
    }

    this.startTime = startTime

    const updateCountdown = () => {
      const elapsed = Date.now() - this.startTime
      const remaining = Math.max(0, reactivateAfter - elapsed)
      const formatted = this.formatTime(remaining)

      if (formatted !== this.lastDisplayedTime) {
        this.lastDisplayedTime = formatted
        this.remainingTime = remaining
        this.requestUpdate()
      }

      if (remaining <= 0 || this.state.isActive) {
        this.clearCountdown()
      }
    }

    updateCountdown()

    if (this.remainingTime > 0 && typeof window !== "undefined") {
      this.intervalId = window.setInterval(updateCountdown, 100)
    }
  }

  private clearCountdown() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isCountdownActive = false
    this.remainingTime = 0
    this.lastDisplayedTime = ""
  }

  private handleTimerClick = (e: MouseEvent) => {
    e.stopPropagation()
    ForesightManager.instance.reactivate(this.element)
  }

  private formatTime(ms: number): string {
    if (ms === Infinity) {
      return "∞"
    }

    const totalSeconds = Math.ceil(ms / 1000)

    if (totalSeconds < 60) {
      return `${totalSeconds}s`
    }

    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes < 60) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    }

    return `${hours}h`
  }

  render() {
    if (!this.isCountdownActive) {
      return html``
    }

    if (this.remainingTime === Infinity) {
      return html`
        <button
          class="reactivate-button"
          @click="${this.handleTimerClick}"
          title="Click to reactivate manually"
        >
          <span class="countdown-time infinity">∞</span>
        </button>
      `
    }

    if (this.remainingTime <= 0) {
      return html``
    }

    return html`
      <button
        class="reactivate-button"
        @click="${this.handleTimerClick}"
        title="Click to reactivate immediately"
      >
        <span class="countdown-time clickable">${this.formatTime(this.remainingTime)}</span>
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reactivate-countdown": ReactivateCountdown
  }
}
