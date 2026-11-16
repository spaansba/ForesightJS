import { LitElement, html, css } from "lit"
import { customElement, query, property } from "lit/decorators.js"
import {
  type ForesightElement,
  type ForesightElementState,
  type ElementBounds,
  type CallbackHitType,
  ForesightManager,
} from "js.foresight"
import type {
  CallbackCompletedEvent,
  CallbackInvokedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"

type HitSlop = ForesightElementState["hitSlop"]
type Scroll = { x: number; y: number }

interface ElementOverlay {
  slopArea: HTMLElement
  nameLabel: HTMLElement
  lastName: string | null
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
  private overlayMap: Map<ForesightElement, ElementOverlay> = new Map()
  private callbackAnimations: Map<ForesightElement, CallbackAnimation> = new Map()
  private _elementSubscriptions: Map<ForesightElement, () => void> = new Map()
  private _pendingUpdates: Set<ForesightElement> = new Set()
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

      .slop-area {
        position: absolute;
        top: 0;
        left: 0;
        box-sizing: border-box;
        border: 1px dashed rgba(100, 116, 139, 0.4);
        background-color: rgba(100, 116, 139, 0.05);
        contain: layout style;
        transition:
          border-color 0.2s ease,
          background-color 0.2s ease;
        pointer-events: none;
      }

      /* The glow pulses opacity on a pre-rendered shadow instead of animating
         box-shadow, so the compositor runs it without repainting. */
      .slop-area::after {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        opacity: 0;
        pointer-events: none;
      }

      .slop-area[data-hit]::after {
        animation: glow 2s ease-in-out infinite;
      }

      .slop-area[data-hit="mouse"] {
        border-color: #3b82f6;
        background-color: rgba(59, 130, 246, 0.1);
      }

      .slop-area[data-hit="mouse"]::after {
        box-shadow: 0 0 15px 4px rgba(59, 130, 246, 0.6);
      }

      .slop-area[data-hit="scroll"] {
        border-color: #eab308;
        background-color: rgba(234, 179, 8, 0.1);
      }

      .slop-area[data-hit="scroll"]::after {
        box-shadow: 0 0 15px 4px rgba(234, 179, 8, 0.6);
      }

      .slop-area[data-hit="tab"] {
        border-color: #f97316;
        background-color: rgba(249, 115, 22, 0.1);
      }

      .slop-area[data-hit="tab"]::after {
        box-shadow: 0 0 15px 4px rgba(249, 115, 22, 0.6);
      }

      @keyframes glow {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 1;
        }
      }

      /* Lives inside its slop area so it moves with the same transform. */
      .name-label {
        position: absolute;
        top: -26px;
        left: -1px;
        z-index: 1;
        background-color: rgba(27, 31, 35, 0.95);
        color: white;
        padding: 4px 8px;
        font-size: 11px;
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif,
          "Apple Color Emoji", "Segoe UI Emoji";
        white-space: nowrap;
        pointer-events: none;
      }

      .name-label:empty,
      #overlays-container[data-hide-names] .name-label {
        display: none;
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
        this._queueUpdate(e.element)
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

    // Elements registered before the devtools mounted (e.g. devtools is
    // lazy-loaded) can only get an overlay once the container has rendered,
    // so the initial sync runs in firstUpdated. On reconnects it can run now.
    if (this.hasUpdated) {
      this._syncAlreadyRegisteredElements()
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

  protected firstUpdated(): void {
    this._syncAlreadyRegisteredElements()
  }

  private _syncAlreadyRegisteredElements(): void {
    for (const element of ForesightManager.instance.registeredElements.keys()) {
      this._subscribeToElement(element)
      this._queueUpdate(element)
    }
  }

  private _subscribeToElement(element: ForesightElement): void {
    if (this._elementSubscriptions.has(element)) {
      return
    }

    const update = () => this._queueUpdate(element)

    // State and geometry are published on separate channels: logical changes
    // (active/intersecting/name) come through subscribeToElement, rect changes
    // during scroll/resize through subscribeToElementBounds.
    const unsubscribeState = ForesightManager.instance.subscribeToElement(element, update)
    const unsubscribeBounds = ForesightManager.instance.subscribeToElementBounds(element, update)

    if (unsubscribeState || unsubscribeBounds) {
      this._elementSubscriptions.set(element, () => {
        unsubscribeState?.()
        unsubscribeBounds?.()
      })
    }
  }

  /**
   * Updates are applied once per task. Reading the scroll offset after another
   * overlay's style writes forces a layout, so updating per element during a
   * position callback for hundreds of elements meant hundreds of layouts.
   */
  private _queueUpdate(element: ForesightElement): void {
    if (this._pendingUpdates.size === 0) {
      queueMicrotask(this._flushUpdates)
    }

    this._pendingUpdates.add(element)
  }

  private _flushUpdates = (): void => {
    // Before the first render there is no container to append to; firstUpdated
    // queues every registered element again.
    if (!this.containerElement) {
      this._pendingUpdates.clear()

      return
    }

    const scroll = { x: window.scrollX, y: window.scrollY }
    for (const element of this._pendingUpdates) {
      const state = ForesightManager.instance.registeredElements.get(element)
      if (!state || !state.isIntersectingWithViewport || !state.isActive) {
        this.removeElementOverlay(element)
      } else {
        this.createOrUpdateElementOverlay(element, state, scroll)
      }
    }
    this._pendingUpdates.clear()
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
    slopArea.appendChild(nameLabel)
    this.containerElement.appendChild(slopArea)
    const overlay = {
      slopArea,
      nameLabel,
      lastName: null,
      lastSlopRect: null,
      lastRadiusKey: null,
    }
    this.overlayMap.set(element, overlay)

    return overlay
  }

  /**
   * The slop area is the element's own shape offset outward by the hit slop:
   * every corner keeps the element's border radius, grown by the slop on each
   * axis. Sharp corners stay sharp, since offsetting a rectangle outward does
   * not round its corners.
   */
  private expandedBorderRadius(
    element: ForesightElement,
    hitSlop: HitSlop,
    rect: DOMRectReadOnly
  ): string {
    const style = getComputedStyle(element as HTMLElement)

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
    hitSlop: HitSlop,
    bounds: ElementBounds,
    scroll: Scroll
  ): void {
    const { expandedRect } = bounds
    // The manager reports viewport-relative rects; convert to document
    // coordinates, which stay constant during scroll.
    const left = expandedRect.left + scroll.x
    const top = expandedRect.top + scroll.y
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
      style.borderRadius = this.expandedBorderRadius(element, hitSlop, bounds.originalRect)
    }
  }

  private updateNameLabel(overlay: ElementOverlay, name: string): void {
    if (overlay.lastName === name) {
      return
    }

    overlay.lastName = name
    overlay.nameLabel.textContent = name === "unnamed" ? "" : name
  }

  private createOrUpdateElementOverlay(
    element: ForesightElement,
    state: ForesightElementState,
    scroll: Scroll
  ) {
    const bounds = ForesightManager.instance.getElementBounds(element)
    if (!bounds) {
      return
    }

    let overlay = this.overlayMap.get(element)
    if (!overlay) {
      overlay = this.createOverlay(element)
    }

    this.updateSlopArea(overlay, element, state.hitSlop, bounds, scroll)
    this.updateNameLabel(overlay, state.name)
  }

  private removeElementOverlay(element: ForesightElement) {
    const overlay = this.overlayMap.get(element)
    if (overlay) {
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

    // The overlay may still be queued when the element became visible and got
    // predicted in the same task.
    if (this._pendingUpdates.has(element)) {
      this._flushUpdates()
    }

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

  disconnectedCallback(): void {
    super.disconnectedCallback()

    for (const unsub of this._elementSubscriptions.values()) {
      unsub()
    }
    this._elementSubscriptions.clear()
    this._pendingUpdates.clear()

    this.callbackAnimations.forEach(animation => {
      clearTimeout(animation.timeoutId)
    })
    this.callbackAnimations.clear()

    for (const overlay of this.overlayMap.values()) {
      overlay.slopArea.remove()
    }
    this.overlayMap.clear()
    this._abortController?.abort()
    this._abortController = null
  }

  render() {
    return html`<div id="overlays-container" ?data-hide-names=${!this.showNameTags}></div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-overlays": ElementOverlays
  }
}
