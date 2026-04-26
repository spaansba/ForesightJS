import { LitElement, html, css, type PropertyValues } from "lit"
import { customElement, state, query, property } from "lit/decorators.js"
import {
  type ForesightElement,
  type ForesightElementState,
  type CallbackHitType,
  ForesightManager,
} from "js.foresight"
import type {
  CallbackCompletedEvent,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementReactivatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"

const STYLE_ID = "foresight-overlay-styles"

const GLOBAL_OVERLAY_CSS = `
[data-foresight-overlay] {
  outline: 1px dashed rgba(100, 116, 139, 0.4) !important;
  outline-offset: var(--fs-slop, 0px) !important;
  box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(100, 116, 139, 0.05) !important;
  transition: outline-color 0.2s ease, box-shadow 0.2s ease !important;
}

[data-foresight-overlay="mouse"] {
  outline-color: #3b82f6 !important;
  box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(59, 130, 246, 0.1),
              0 0 15px 4px rgba(59, 130, 246, 0.4) !important;
  animation: foresight-glow-mouse 2s ease-in-out infinite !important;
}

[data-foresight-overlay="scroll"] {
  outline-color: #eab308 !important;
  box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(234, 179, 8, 0.1),
              0 0 15px 4px rgba(234, 179, 8, 0.4) !important;
  animation: foresight-glow-scroll 2s ease-in-out infinite !important;
}

[data-foresight-overlay="tab"] {
  outline-color: #f97316 !important;
  box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(249, 115, 22, 0.1),
              0 0 15px 4px rgba(249, 115, 22, 0.4) !important;
  animation: foresight-glow-tab 2s ease-in-out infinite !important;
}

@keyframes foresight-glow-mouse {
  0% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(59, 130, 246, 0.1), 0 0 5px 2px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(59, 130, 246, 0.1), 0 0 15px 4px rgba(59, 130, 246, 0.6); }
  100% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(59, 130, 246, 0.1), 0 0 5px 2px rgba(59, 130, 246, 0.3); }
}

@keyframes foresight-glow-scroll {
  0% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(234, 179, 8, 0.1), 0 0 5px 2px rgba(234, 179, 8, 0.3); }
  50% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(234, 179, 8, 0.1), 0 0 15px 4px rgba(234, 179, 8, 0.6); }
  100% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(234, 179, 8, 0.1), 0 0 5px 2px rgba(234, 179, 8, 0.3); }
}

@keyframes foresight-glow-tab {
  0% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(249, 115, 22, 0.1), 0 0 5px 2px rgba(249, 115, 22, 0.3); }
  50% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(249, 115, 22, 0.1), 0 0 15px 4px rgba(249, 115, 22, 0.6); }
  100% { box-shadow: 0 0 0 var(--fs-slop, 0px) rgba(249, 115, 22, 0.1), 0 0 5px 2px rgba(249, 115, 22, 0.3); }
}
`

interface ElementOverlay {
  nameLabel: HTMLElement
}

interface CallbackAnimation {
  element: ForesightElement
  timeoutId: ReturnType<typeof setTimeout>
}

@customElement("element-overlays")
export class ElementOverlays extends LitElement {
  @state() private overlayMap: Map<ForesightElement, ElementOverlay> = new Map()
  @state() private callbackAnimations: Map<ForesightElement, CallbackAnimation> = new Map()
  @query("#overlays-container") private containerElement!: HTMLElement

  @property({ type: Boolean }) showNameTags = true

  static styles = [
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }

      :host([hidden]) {
        display: none;
      }

      .name-label {
        position: absolute;
        top: 0;
        left: 0;
        will-change: transform;
        background-color: rgba(27, 31, 35, 0.85);
        backdrop-filter: blur(4px);
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
          "Apple Color Emoji", "Segoe UI Emoji";
        z-index: 10001;
        white-space: nowrap;
        pointer-events: none;
      }
    `,
  ]

  private _abortController: AbortController | null = null
  private _styleElement: HTMLStyleElement | null = null

  private injectGlobalStylesheet(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = GLOBAL_OVERLAY_CSS
    document.head.appendChild(style)
    this._styleElement = style
  }

  private removeGlobalStylesheet(): void {
    this._styleElement?.remove()
    this._styleElement = null
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.injectGlobalStylesheet()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        if (e.state.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.removeElementOverlay(e.element)
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementReactivated",
      (e: ElementReactivatedEvent) => {
        if (e.state.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        if (e.updatedProps.includes("bounds") && e.state.isActive) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
        if (e.updatedProps.includes("visibility")) {
          if (!e.state.isIntersectingWithViewport) {
            this.removeElementOverlay(e.element)
          }
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this.highlightElementCallback(e.element, e.hitType)
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        this.unhighlightElementCallback(e.element)
        this.removeElementOverlay(e.element)
      },
      { signal }
    )
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("showNameTags")) {
      this.updateNameTagVisibility(this.showNameTags)
    }
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
    super.attributeChangedCallback(name, oldVal, newVal)
    if (name === "hidden") {
      if (newVal !== null) {
        // Hidden — remove overlay styles from all elements
        for (const element of this.overlayMap.keys()) {
          this.removeOverlayFromElement(element)
        }
      } else {
        // Shown — reapply overlay styles to all tracked elements
        for (const [element] of this.overlayMap) {
          const state = ForesightManager.instance.registeredElements.get(element)
          if (state) {
            this.applyOverlayToElement(element, state)
          }
        }
      }
    }
  }

  private applyOverlayToElement(element: ForesightElement, state: ForesightElementState): void {
    const { hitSlop } = state.elementBounds
    const maxSlop = Math.max(hitSlop.top, hitSlop.right, hitSlop.bottom, hitSlop.left)
    element.setAttribute("data-foresight-overlay", "")
    ;(element as HTMLElement).style.setProperty("--fs-slop", `${maxSlop}px`)
  }

  private removeOverlayFromElement(element: ForesightElement): void {
    element.removeAttribute("data-foresight-overlay")
    ;(element as HTMLElement).style.removeProperty("--fs-slop")
  }

  private createNameLabel(element: ForesightElement): ElementOverlay {
    const nameLabel = document.createElement("div")
    nameLabel.className = "name-label"
    this.containerElement.appendChild(nameLabel)
    const overlay = { nameLabel }
    this.overlayMap.set(element, overlay)
    return overlay
  }

  private updateNameLabel(overlay: ElementOverlay, state: ForesightElementState): void {
    const { nameLabel } = overlay
    const { expandedRect } = state.elementBounds

    if (!this.showNameTags || state.name === "unnamed") {
      nameLabel.style.display = "none"
    } else {
      nameLabel.textContent = state.name
      nameLabel.style.display = "block"
      nameLabel.style.transform = `translate3d(${expandedRect.left}px, ${
        expandedRect.top - 25
      }px, 0)`
    }
  }

  private createOrUpdateElementOverlay(element: ForesightElement, state: ForesightElementState) {
    this.applyOverlayToElement(element, state)

    let overlay = this.overlayMap.get(element)
    if (!overlay) {
      overlay = this.createNameLabel(element)
    }
    this.updateNameLabel(overlay, state)
  }

  private removeElementOverlay(element: ForesightElement) {
    this.removeOverlayFromElement(element)

    const overlay = this.overlayMap.get(element)
    if (overlay) {
      overlay.nameLabel.remove()
      this.overlayMap.delete(element)
    }

    this.clearCallbackAnimationTimeout(element)
  }

  private clearCallbackAnimationTimeout(element: ForesightElement) {
    const existingAnimation = this.callbackAnimations.get(element)
    if (existingAnimation) {
      clearTimeout(existingAnimation.timeoutId)
      this.callbackAnimations.delete(element)
    }
  }

  private highlightElementCallback(element: ForesightElement, hitType: CallbackHitType) {
    this.clearCallbackAnimationTimeout(element)

    switch (hitType.kind) {
      case "mouse":
        element.setAttribute("data-foresight-overlay", "mouse")
        break
      case "scroll":
        element.setAttribute("data-foresight-overlay", "scroll")
        break
      case "tab":
        element.setAttribute("data-foresight-overlay", "tab")
        break
      case "touch":
        break
      case "viewport":
        break
      default:
        hitType satisfies never
    }
  }

  private unhighlightElementCallback(element: ForesightElement) {
    const animationDelay = setTimeout(() => {
      element.setAttribute("data-foresight-overlay", "")
      this.callbackAnimations.delete(element)
    }, 400)

    this.callbackAnimations.set(element, {
      element,
      timeoutId: animationDelay,
    })
  }

  public updateNameTagVisibility(showNameTags: boolean) {
    this.overlayMap.forEach(overlay => {
      const nameLabel = overlay.nameLabel
      if (!showNameTags) {
        nameLabel.style.display = "none"
      } else {
        nameLabel.style.display = "block"
      }
    })
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()

    // Clean up overlay attributes from all tracked elements
    for (const element of this.overlayMap.keys()) {
      this.removeOverlayFromElement(element)
    }

    this.callbackAnimations.forEach(animation => {
      clearTimeout(animation.timeoutId)
    })
    this.callbackAnimations.clear()
    this.overlayMap.clear()
    this._abortController?.abort()
    this._abortController = null
    this.removeGlobalStylesheet()
  }

  render() {
    return html` <div id="overlays-container"></div> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-overlays": ElementOverlays
  }
}
