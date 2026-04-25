import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { map } from "lit/directives/map.js"

import type {
  CallbackCompletedEvent,
  CallbackHits,
  CallbackHitType,
  CallbackInvokedEvent,
  ElementDataUpdatedEvent,
  ElementReactivatedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"
import { ForesightManager, type ForesightElement, type ForesightElementState } from "js.foresight"

type ElementListEntry = { element: ForesightElement; state: ForesightElementState }
import { DOCUMENT_SVG, INSERTION_SVG, VISIBILITY_SVG } from "../../../svg/svg-icons"
import type { SortElementList } from "../../../types/types"
import { ForesightDevtools } from "../../foresight-devtools"
import "../base-tab/chip"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../dropdown/single-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../element-tab/single-element"
import "./reactivate-countdown"

@customElement("element-tab")
export class ElementTab extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chips-container {
      display: flex;
      gap: 8px;
    }

    .element-section {
      margin-bottom: 16px;
    }

    .element-section:last-child {
      margin-bottom: 0;
    }

    .section-header {
      margin: 4px 0 4px 0;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .section-header:hover {
      opacity: 0.8;
    }

    .section-header::before {
      content: "▼";
      display: inline-block;
      transition: transform 0.15s ease;
      font-size: 10px;
    }

    .section-header.collapsed::before {
      transform: rotate(-90deg);
    }

    .section-header.active {
      color: #e8e8e8;
    }

    .section-header.inactive {
      color: #999;
    }
  `

  @state()
  private hitCount: CallbackHits = {
    mouse: { hover: 0, trajectory: 0 },
    scroll: { down: 0, left: 0, right: 0, up: 0 },
    tab: { forwards: 0, reverse: 0 },
    touch: 0,
    viewport: 0,
    total: 0,
  }

  @state() private sortDropdown: DropdownOption[]
  @state() private sortOrder: SortElementList
  @state() private elementListItems: Map<ForesightElement, ForesightElementState> = new Map()
  @state() private noContentMessage: string = "No Elements Registered To The Foresight Manager"
  @state() private runningCallbacks: Set<ForesightElement> = new Set()
  @state() private expandedElementIds: Set<string> = new Set()
  @state() private activeSectionCollapsed = false
  @state() private inactiveSectionCollapsed = false
  private _abortController: AbortController | null = null
  private _pendingElementUpdates: Map<ForesightElement, ForesightElementState> = new Map()
  private _updateDebounceId: ReturnType<typeof setTimeout> | null = null
  // Cached sorted element lists to avoid repeated filtering in render
  private _cachedActiveElements: ElementListEntry[] = []
  private _cachedInactiveElements: ElementListEntry[] = []
  private _elementsCacheDirty = true

  constructor() {
    super()
    this.sortOrder = ForesightDevtools.instance.devtoolsSettings.sortElementList
    this.sortDropdown = [
      {
        value: "visibility",
        label: "Visibility",
        title: "Sort by Visibility",
        icon: VISIBILITY_SVG,
      },
      {
        value: "documentOrder",
        label: "Document Order",
        title: "Sort by Document Order",
        icon: DOCUMENT_SVG,
      },
      {
        value: "insertionOrder",
        label: "Insertion Order",
        title: "Sort by Insertion Order",
        icon: INSERTION_SVG,
      },
    ]
  }

  private handleSortChange = (value: string): void => {
    this.sortOrder = value as SortElementList
    this._elementsCacheDirty = true
  }

  private handleElementToggle = (elementId: string): void => {
    const newExpandedElementIds = new Set(this.expandedElementIds)
    if (newExpandedElementIds.has(elementId)) {
      newExpandedElementIds.delete(elementId)
    } else {
      newExpandedElementIds.add(elementId)
    }
    this.expandedElementIds = newExpandedElementIds
  }

  private _generateHitsChipTitle(hitCounts: CallbackHits): string {
    const lines: string[] = []

    // Header with total
    lines.push(`Total Callback Hits: ${hitCounts.total}`)
    lines.push("")

    // Desktop Strategy Section
    const mouseTotal = hitCounts.mouse.trajectory + hitCounts.mouse.hover
    const scrollTotal =
      hitCounts.scroll.up + hitCounts.scroll.down + hitCounts.scroll.left + hitCounts.scroll.right
    const tabTotal = hitCounts.tab.forwards + hitCounts.tab.reverse

    lines.push("Desktop Strategy")
    if (mouseTotal > 0) {
      lines.push(
        `   Mouse (${mouseTotal}): ${hitCounts.mouse.trajectory} trajectory, ${hitCounts.mouse.hover} hover`
      )
    } else {
      lines.push("   Mouse: No hits")
    }

    if (scrollTotal > 0) {
      lines.push(
        `   Scroll (${scrollTotal}): Up ${hitCounts.scroll.up}, Down ${hitCounts.scroll.down}, Left ${hitCounts.scroll.left}, Right ${hitCounts.scroll.right}`
      )
    } else {
      lines.push("   Scroll: No hits")
    }

    if (tabTotal > 0) {
      lines.push(
        `   Tab (${tabTotal}): ${hitCounts.tab.forwards} forward, ${hitCounts.tab.reverse} reverse`
      )
    } else {
      lines.push("   Tab: No hits")
    }

    lines.push("")

    // Touch Strategy Section
    const touchStrategyTotal = hitCounts.touch + hitCounts.viewport
    lines.push("Touch Strategy")
    if (hitCounts.touch > 0) {
      lines.push(`   Touch Start: ${hitCounts.touch}`)
    } else {
      lines.push("   Touch Start: No hits")
    }

    if (hitCounts.viewport > 0) {
      lines.push(`   Viewport Enter: ${hitCounts.viewport}`)
    } else {
      lines.push("   Viewport Enter: No hits")
    }

    if (touchStrategyTotal === 0 && mouseTotal + scrollTotal + tabTotal === 0) {
      lines.push("")
      lines.push("Interact with registered elements to see callback statistics")
    }

    return lines.join("\n")
  }

  connectedCallback() {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    this.updateElementListFromManager()

    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        this.elementListItems.set(e.element, e.state)
        this._elementsCacheDirty = true
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementDataUpdated",
      (e: ElementDataUpdatedEvent) => {
        if (this.elementListItems.has(e.element)) {
          // Batch updates and debounce to avoid excessive re-renders during scroll
          this._pendingElementUpdates.set(e.element, e.state)
          this._scheduleDebouncedUpdate()
        }
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementReactivated",
      (e: ElementReactivatedEvent) => {
        if (!this.applyStateUpdate(e.element, e.state)) return
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this.elementListItems.delete(e.element)
        if (!this.elementListItems.size) {
          this.noContentMessage = "No Elements Registered To The Foresight Manager"
        }
        this.runningCallbacks.delete(e.element)
        this._elementsCacheDirty = true
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this.applyStateUpdate(e.element, e.state)
        this.runningCallbacks.add(e.element)
        this._elementsCacheDirty = true
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      (e: CallbackCompletedEvent) => {
        this.applyStateUpdate(e.element, e.state)
        this.handleCallbackCompleted(e.hitType)
        this.runningCallbacks.delete(e.element)
        this._elementsCacheDirty = true
        this.requestUpdate()
      },
      { signal }
    )
  }

  private applyStateUpdate(element: ForesightElement, state: ForesightElementState): boolean {
    if (!this.elementListItems.has(element)) return false
    this.elementListItems.set(element, state)
    this._elementsCacheDirty = true
    return true
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null
    if (this._updateDebounceId !== null) {
      clearTimeout(this._updateDebounceId)
      this._updateDebounceId = null
    }
    this._pendingElementUpdates.clear()
  }

  private _scheduleDebouncedUpdate(): void {
    // Already scheduled, let the pending timeout handle it
    if (this._updateDebounceId !== null) {
      return
    }

    // Debounce updates to ~60fps (16ms) to batch rapid updates
    this._updateDebounceId = setTimeout(() => {
      this._updateDebounceId = null
      this._flushPendingUpdates()
    }, 16)
  }

  private _flushPendingUpdates(): void {
    if (this._pendingElementUpdates.size === 0) {
      return
    }

    // Apply all pending updates in one batch
    for (const [element, state] of this._pendingElementUpdates) {
      this.elementListItems.set(element, state)
    }
    this._pendingElementUpdates.clear()
    this._elementsCacheDirty = true
    this.requestUpdate()
  }

  private updateElementListFromManager() {
    this.elementListItems = new Map(ForesightManager.instance.registeredElements)
    this._elementsCacheDirty = true
  }

  private handleCallbackCompleted(hitType: CallbackHitType) {
    switch (hitType.kind) {
      case "mouse":
        this.hitCount.mouse[hitType.subType]++
        break
      case "tab":
        this.hitCount.tab[hitType.subType]++
        break
      case "scroll":
        this.hitCount.scroll[hitType.subType]++
        break
      case "touch":
        this.hitCount.touch++
        break
      case "viewport":
        this.hitCount.viewport++
        break
      default:
        hitType satisfies never
    }

    this.hitCount.total++
    this.requestUpdate()
  }

  private getSortedElements(): ElementListEntry[] {
    const entries: ElementListEntry[] = Array.from(
      this.elementListItems,
      ([element, state]) => ({ element, state })
    )

    switch (this.sortOrder) {
      case "insertionOrder":
        return entries
      case "documentOrder":
        return entries.sort(this.sortByDocumentPosition)
      case "visibility":
        return entries.sort((a, b) => {
          if (a.state.isIntersectingWithViewport !== b.state.isIntersectingWithViewport) {
            return a.state.isIntersectingWithViewport ? -1 : 1
          }
          return this.sortByDocumentPosition(a, b)
        })
      default:
        this.sortOrder satisfies never
        return entries
    }
  }

  private _recomputeElementsCache(): void {
    if (!this._elementsCacheDirty) {
      return
    }

    const sorted = this.getSortedElements()
    this._cachedActiveElements = sorted.filter(entry => entry.state.isActive)
    this._cachedInactiveElements = sorted.filter(entry => !entry.state.isActive)
    this._elementsCacheDirty = false
  }

  private get activeElements(): ElementListEntry[] {
    this._recomputeElementsCache()

    return this._cachedActiveElements
  }

  private get inactiveElements(): ElementListEntry[] {
    this._recomputeElementsCache()

    return this._cachedInactiveElements
  }

  private sortByDocumentPosition = (a: ElementListEntry, b: ElementListEntry) => {
    const position = a.element.compareDocumentPosition(b.element)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  }

  render() {
    return html`
      <tab-header>
        <div slot="chips" class="chips-container">
          <chip-element title="${this._generateHitsChipTitle(this.hitCount)}">
            ${this.hitCount.total} hits
          </chip-element>
        </div>
        <div slot="actions">
          <single-select-dropdown
            .dropdownOptions="${this.sortDropdown}"
            .selectedOptionValue="${this.sortOrder}"
            .onSelectionChange="${this.handleSortChange}"
          ></single-select-dropdown>
        </div>
      </tab-header>
      <tab-content
        .noContentMessage=${this.noContentMessage}
        .hasContent=${!!this.elementListItems.size}
      >
        ${this.activeElements.length > 0
          ? html`
              <div class="element-section">
                <h3
                  class="section-header active ${this.activeSectionCollapsed ? "collapsed" : ""}"
                  @click=${() => {
                    this.activeSectionCollapsed = !this.activeSectionCollapsed
                  }}
                >
                  Active Elements (${this.activeElements.length})
                </h3>
                ${!this.activeSectionCollapsed
                  ? map(this.activeElements, entry => {
                      return html`
                        <single-element
                          .element=${entry.element}
                          .state=${entry.state}
                          .isPredicting=${this.runningCallbacks.has(entry.element)}
                          .isExpanded=${this.expandedElementIds.has(entry.state.id)}
                          .onToggle=${this.handleElementToggle}
                        >
                        </single-element>
                      `
                    })
                  : ""}
              </div>
            `
          : ""}
        ${this.inactiveElements.length > 0
          ? html`
              <div class="element-section">
                <h3
                  class="section-header inactive ${this.inactiveSectionCollapsed
                    ? "collapsed"
                    : ""}"
                  @click=${() => {
                    this.inactiveSectionCollapsed = !this.inactiveSectionCollapsed
                  }}
                >
                  Inactive Elements (${this.inactiveElements.length})
                </h3>
                ${!this.inactiveSectionCollapsed
                  ? map(this.inactiveElements, entry => {
                      return html`
                        <single-element
                          .element=${entry.element}
                          .state=${entry.state}
                          .isPredicting=${this.runningCallbacks.has(entry.element)}
                          .isExpanded=${this.expandedElementIds.has(entry.state.id)}
                          .onToggle=${this.handleElementToggle}
                        >
                        </single-element>
                      `
                    })
                  : ""}
              </div>
            `
          : ""}
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-tab": ElementTab
  }
}
