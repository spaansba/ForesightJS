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
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"

type HitSlop = ForesightElementState["elementBounds"]["hitSlop"]

interface ElementOverlay {
  nameLabel: HTMLElement
  slopArea: HTMLElement
  /** Last applied document-coordinate rect; unchanged means no style writes needed. */
  lastSlopRect: { left: number; top: number; width: number; height: number } | null
  /** Size + hit slop the cached border radius was computed for. */
  lastRadiusKey: string | null
}

interface CallbackAnimation {
  element: ForesightElement
  timeoutId: ReturnType<typeof setTimeout>
}

@customElement("element-overlays")
export class ElementOverlays extends LitElement {
  @state() private overlayMap: Map<ForesightElement, ElementOverlay> = new Map()
  @state() private callbackAnimations: Map<ForesightElement, CallbackAnimation> = new Map()
  private _elementSubscriptions: Map<ForesightElement, () => void> = new Map()
  @query("#overlays-container") private containerElement!: HTMLElement

  @property({ type: Boolean }) showNameTags = true

  static styles = [
    css`
      /* Anchored to the document origin (initial containing block), not the
         viewport: overlays are placed in document coordinates so the compositor
         moves them together with the page content during scroll, instead of
         JS chasing the scroll position a frame behind. */
      :host {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        pointer-events: none;
        z-index: 9999;
      }

      :host([hidden]) {
        display: none;
      }

      .slop-area {
        position: absolute;
        top: 0;
        left: 0;
        box-sizing: border-box;
        will-change: transform;
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        transition:
          border-color 0.2s ease,
          background-color 0.2s ease,
          box-shadow 0.2s ease;
        pointer-events: none;
      }

      .slop-area[data-hit="mouse"] {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
        animation: glow-mouse 2s ease-in-out infinite;
      }

      .slop-area[data-hit="scroll"] {
        border-color: #eab308;
        background-color: rgba(234, 179, 8, 0.1);
        animation: glow-scroll 2s ease-in-out infinite;
      }

      .slop-area[data-hit="tab"] {
        border-color: #f97316;
        background-color: rgba(249, 115, 22, 0.1);
        animation: glow-tab 2s ease-in-out infinite;
      }

      @keyframes glow-mouse {
        0% {
          box-shadow: 0 0 5px 2px rgba(59, 130, 246, 0.3);
        }
        50% {
          box-shadow: 0 0 15px 4px rgba(59, 130, 246, 0.6);
        }
        100% {
          box-shadow: 0 0 5px 2px rgba(59, 130, 246, 0.3);
        }
      }

      @keyframes glow-scroll {
        0% {
          box-shadow: 0 0 5px 2px rgba(234, 179, 8, 0.3);
        }
        50% {
          box-shadow: 0 0 15px 4px rgba(234, 179, 8, 0.6);
        }
        100% {
          box-shadow: 0 0 5px 2px rgba(234, 179, 8, 0.3);
        }
      }

      @keyframes glow-tab {
        0% {
          box-shadow: 0 0 5px 2px rgba(249, 115, 22, 0.3);
        }
        50% {
          box-shadow: 0 0 15px 4px rgba(249, 115, 22, 0.6);
        }
        100% {
          box-shadow: 0 0 5px 2px rgba(249, 115, 22, 0.3);
        }
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

  connectedCallback(): void {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        this._subscribeToElement(e.element)
        if (e.state.isIntersectingWithViewport) {
          this.createOrUpdateElementOverlay(e.element, e.state)
        }
      },
      { signal }
    )
    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this._unsubscribeFromElement(e.element)
        this.removeElementOverlay(e.element)
      },
      { signal }
    )

    // Subscribe to already-registered elements
    for (const [element, state] of ForesightManager.instance.registeredElements) {
      this._subscribeToElement(element)
      if (state.isIntersectingWithViewport && state.isActive) {
        this.createOrUpdateElementOverlay(element, state)
      }
    }
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

  private _subscribeToElement(element: ForesightElement): void {
    if (this._elementSubscriptions.has(element)) {
      return
    }

    const unsubscribe = ForesightManager.instance.subscribeToElement(element, () => {
      const state = ForesightManager.instance.registeredElements.get(element)
      if (!state || !state.isIntersectingWithViewport || !state.isActive) {
        this.removeElementOverlay(element)

        return
      }

      this.createOrUpdateElementOverlay(element, state)
    })

    if (unsubscribe) {
      this._elementSubscriptions.set(element, unsubscribe)
    }
  }

  private _unsubscribeFromElement(element: ForesightElement): void {
    this._elementSubscriptions.get(element)?.()
    this._elementSubscriptions.delete(element)
  }

  private createOverlay(element: ForesightElement): ElementOverlay {
    const slopArea = document.createElement("div")
    slopArea.className = "slop-area"
    const nameLabel = document.createElement("div")
    nameLabel.className = "name-label"
    this.containerElement.appendChild(slopArea)
    this.containerElement.appendChild(nameLabel)
    const overlay = { nameLabel, slopArea, lastSlopRect: null, lastRadiusKey: null }
    this.overlayMap.set(element, overlay)

    return overlay
  }

  /**
   * The slop area is the element's own shape offset outward by the hit slop:
   * every corner keeps the element's border radius, grown by the slop on each
   * axis. Sharp corners stay sharp, since offsetting a rectangle outward does
   * not round its corners.
   */
  private expandedBorderRadius(element: ForesightElement, hitSlop: HitSlop): string {
    const style = getComputedStyle(element as HTMLElement)
    const rect = (element as HTMLElement).getBoundingClientRect()

    const corner = (value: string, slopX: number, slopY: number): [number, number] => {
      const [xRaw, yRaw = xRaw] = value.split(" ")
      const parse = (raw: string, base: number) => {
        const parsed = parseFloat(raw) || 0

        return raw.endsWith("%") ? (parsed / 100) * base : parsed
      }
      const x = parse(xRaw, rect.width)
      const y = parse(yRaw, rect.height)

      return [x === 0 ? 0 : x + slopX, y === 0 ? 0 : y + slopY]
    }

    const tl = corner(style.borderTopLeftRadius, hitSlop.left, hitSlop.top)
    const tr = corner(style.borderTopRightRadius, hitSlop.right, hitSlop.top)
    const br = corner(style.borderBottomRightRadius, hitSlop.right, hitSlop.bottom)
    const bl = corner(style.borderBottomLeftRadius, hitSlop.left, hitSlop.bottom)

    return `${tl[0]}px ${tr[0]}px ${br[0]}px ${bl[0]}px / ${tl[1]}px ${tr[1]}px ${br[1]}px ${bl[1]}px`
  }

  private updateSlopArea(
    overlay: ElementOverlay,
    element: ForesightElement,
    state: ForesightElementState
  ): void {
    const { expandedRect, hitSlop } = state.elementBounds
    // The manager reports viewport-relative rects; convert to document
    // coordinates, which stay constant during scroll.
    const left = expandedRect.left + window.scrollX
    const top = expandedRect.top + window.scrollY
    const width = expandedRect.right - expandedRect.left
    const height = expandedRect.bottom - expandedRect.top

    const last = overlay.lastSlopRect
    if (
      last &&
      last.left === left &&
      last.top === top &&
      last.width === width &&
      last.height === height
    ) {
      return
    }

    overlay.lastSlopRect = { left, top, width, height }

    const { style } = overlay.slopArea
    style.transform = `translate3d(${left}px, ${top}px, 0)`
    style.width = `${width}px`
    style.height = `${height}px`

    const radiusKey = `${width}|${height}|${hitSlop.top}|${hitSlop.right}|${hitSlop.bottom}|${hitSlop.left}`
    if (overlay.lastRadiusKey !== radiusKey) {
      overlay.lastRadiusKey = radiusKey
      style.borderRadius = this.expandedBorderRadius(element, hitSlop)
    }
  }

  private updateNameLabel(overlay: ElementOverlay, state: ForesightElementState): void {
    const { nameLabel } = overlay
    const { expandedRect } = state.elementBounds

    if (!this.showNameTags || state.name === "unnamed") {
      nameLabel.style.display = "none"
    } else {
      nameLabel.textContent = state.name
      nameLabel.style.display = "block"
      nameLabel.style.transform = `translate3d(${expandedRect.left + window.scrollX}px, ${
        expandedRect.top - 25 + window.scrollY
      }px, 0)`
    }
  }

  private createOrUpdateElementOverlay(element: ForesightElement, state: ForesightElementState) {
    let overlay = this.overlayMap.get(element)
    if (!overlay) {
      overlay = this.createOverlay(element)
    }

    this.updateSlopArea(overlay, element, state)
    this.updateNameLabel(overlay, state)
  }

  private removeElementOverlay(element: ForesightElement) {
    const overlay = this.overlayMap.get(element)
    if (overlay) {
      overlay.nameLabel.remove()
      overlay.slopArea.remove()
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

    const overlay = this.overlayMap.get(element)
    if (!overlay) {
      return
    }

    switch (hitType.kind) {
      case "mouse":
      case "scroll":
      case "tab":
        overlay.slopArea.dataset.hit = hitType.kind
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
      const overlay = this.overlayMap.get(element)
      if (overlay) {
        delete overlay.slopArea.dataset.hit
      }

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

    for (const unsub of this._elementSubscriptions.values()) {
      unsub()
    }
    this._elementSubscriptions.clear()

    this.callbackAnimations.forEach(animation => {
      clearTimeout(animation.timeoutId)
    })
    this.callbackAnimations.clear()

    for (const overlay of this.overlayMap.values()) {
      overlay.nameLabel.remove()
      overlay.slopArea.remove()
    }
    this.overlayMap.clear()
    this._abortController?.abort()
    this._abortController = null
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
