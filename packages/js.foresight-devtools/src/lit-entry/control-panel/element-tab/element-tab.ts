import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { repeat } from "lit/directives/repeat.js"

import type {
  CallbackHits,
  CallbackInvokedEvent,
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

  private get hitCount(): CallbackHits {
    return ForesightManager.instance.getManagerData.globalCallbackHits
  }

  @state() private sortDropdown: DropdownOption[]
  @state() private sortOrder: SortElementList
  @state() private elementListItems: Map<ForesightElement, ForesightElementState> = new Map()
  @state() private noContentMessage: string = "No Elements Registered To The Foresight Manager"
  @state() private expandedElementIds: Set<string> = new Set()
  @state() private activeSectionCollapsed = false
  @state() private inactiveSectionCollapsed = false
  private _abortController: AbortController | null = null
  private _elementSubscriptions: Map<ForesightElement, () => void> = new Map()
  private _pendingElementUpdates: Map<ForesightElement, ForesightElementState> = new Map()
  private _updateDebounceId: ReturnType<typeof setTimeout> | null = null
  // Cached sorted element order; states are looked up at render time so the
  // cache never holds stale state objects.
  private _cachedActiveElements: ForesightElement[] = []
  private _cachedInactiveElements: ForesightElement[] = []
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

  /**
   * The list doesn't render element rects (only hit slop), so rect-only state
   * patches — fired for every element on every scroll/resize tick — are
   * filtered out before they can schedule any work.
   */
  private _affectsElementList(
    previous: ForesightElementState,
    next: ForesightElementState
  ): boolean {
    if (previous === next) {
      return false
    }

    for (const key of Object.keys(next) as (keyof ForesightElementState)[]) {
      if (key !== "elementBounds" && next[key] !== previous[key]) {
        return true
      }
    }

    return next.elementBounds.hitSlop !== previous.elementBounds.hitSlop
  }

  private _subscribeToElement(element: ForesightElement): void {
    if (this._elementSubscriptions.has(element)) {
      return
    }

    const unsubscribe = ForesightManager.instance.subscribeToElement(element, () => {
      const state = ForesightManager.instance.registeredElements.get(element)
      if (!state || !state.isRegistered) {
        return
      }

      const known = this._pendingElementUpdates.get(element) ?? this.elementListItems.get(element)
      if (known && !this._affectsElementList(known, state)) {
        return
      }

      this._pendingElementUpdates.set(element, state)
      this._scheduleDebouncedUpdate()
    })

    if (unsubscribe) {
      this._elementSubscriptions.set(element, unsubscribe)
    }
  }

  private _unsubscribeFromElement(element: ForesightElement): void {
    this._elementSubscriptions.get(element)?.()
    this._elementSubscriptions.delete(element)
  }

  connectedCallback() {
    super.connectedCallback()
    this._abortController = new AbortController()
    const { signal } = this._abortController
    this.updateElementListFromManager()

    for (const element of this.elementListItems.keys()) {
      this._subscribeToElement(element)
    }

    ForesightManager.instance.addEventListener(
      "elementRegistered",
      (e: ElementRegisteredEvent) => {
        this.elementListItems.set(e.element, e.state)
        this._subscribeToElement(e.element)
        this._elementsCacheDirty = true
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "elementUnregistered",
      (e: ElementUnregisteredEvent) => {
        this._unsubscribeFromElement(e.element)
        this.elementListItems.delete(e.element)
        // Drop any queued update so a later debounce flush can't re-add it.
        this._pendingElementUpdates.delete(e.element)
        if (!this.elementListItems.size) {
          this.noContentMessage = "No Elements Registered To The Foresight Manager"
        }

        this._elementsCacheDirty = true
        this.requestUpdate()
      },
      { signal }
    )

    ForesightManager.instance.addEventListener(
      "callbackInvoked",
      (e: CallbackInvokedEvent) => {
        this._pendingElementUpdates.set(e.element, e.state)
        this._scheduleDebouncedUpdate()
      },
      { signal }
    )

    // The manager has already updated its global hit counters; just re-render.
    ForesightManager.instance.addEventListener(
      "callbackCompleted",
      () => {
        this.requestUpdate()
      },
      { signal }
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._abortController?.abort()
    this._abortController = null

    for (const unsub of this._elementSubscriptions.values()) {
      unsub()
    }
    this._elementSubscriptions.clear()

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

    // Apply all pending updates in one batch; the sort order only depends on
    // membership, isActive and isIntersectingWithViewport.
    for (const [element, state] of this._pendingElementUpdates) {
      const previous = this.elementListItems.get(element)
      if (
        !previous ||
        previous.isActive !== state.isActive ||
        previous.isIntersectingWithViewport !== state.isIntersectingWithViewport
      ) {
        this._elementsCacheDirty = true
      }

      this.elementListItems.set(element, state)
    }
    this._pendingElementUpdates.clear()
    this.requestUpdate()
  }

  private updateElementListFromManager() {
    this.elementListItems = new Map(ForesightManager.instance.registeredElements)
    this._elementsCacheDirty = true
  }

  private getSortedElements(): ElementListEntry[] {
    const entries: ElementListEntry[] = Array.from(this.elementListItems, ([element, state]) => ({
      element,
      state,
    }))

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

    const active: ForesightElement[] = []
    const inactive: ForesightElement[] = []
    for (const entry of this.getSortedElements()) {
      // Disabled elements are inactive too; their reason is shown as a badge on the
      // row rather than a separate section.
      if (entry.state.isActive) {
        active.push(entry.element)
      } else {
        inactive.push(entry.element)
      }
    }
    this._cachedActiveElements = active
    this._cachedInactiveElements = inactive
    this._elementsCacheDirty = false
  }

  private get activeElements(): ForesightElement[] {
    this._recomputeElementsCache()

    return this._cachedActiveElements
  }

  private get inactiveElements(): ForesightElement[] {
    this._recomputeElementsCache()

    return this._cachedInactiveElements
  }

  private sortByDocumentPosition = (a: ElementListEntry, b: ElementListEntry) => {
    const position = a.element.compareDocumentPosition(b.element)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1
    }

    if (position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1
    }

    return 0
  }

  private renderElementSection(
    label: string,
    modifierClass: string,
    elements: ForesightElement[],
    collapsed: boolean,
    toggleCollapsed: () => void
  ) {
    if (elements.length === 0) {
      return ""
    }

    return html`
      <div class="element-section">
        <h3
          class="section-header ${modifierClass} ${collapsed ? "collapsed" : ""}"
          @click=${toggleCollapsed}
        >
          ${label} (${elements.length})
        </h3>
        ${!collapsed
          ? repeat(
              elements,
              element => this.elementListItems.get(element)?.id ?? "",
              element => {
                const state = this.elementListItems.get(element)
                if (!state) {
                  return ""
                }

                return html`
                  <single-element
                    .element=${element}
                    .state=${state}
                    .isExpanded=${this.expandedElementIds.has(state.id)}
                    .onToggle=${this.handleElementToggle}
                  >
                  </single-element>
                `
              }
            )
          : ""}
      </div>
    `
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
        ${this.renderElementSection(
          "Active Elements",
          "active",
          this.activeElements,
          this.activeSectionCollapsed,
          () => {
            this.activeSectionCollapsed = !this.activeSectionCollapsed
          }
        )}
        ${this.renderElementSection(
          "Inactive Elements",
          "inactive",
          this.inactiveElements,
          this.inactiveSectionCollapsed,
          () => {
            this.inactiveSectionCollapsed = !this.inactiveSectionCollapsed
          }
        )}
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-tab": ElementTab
  }
}
