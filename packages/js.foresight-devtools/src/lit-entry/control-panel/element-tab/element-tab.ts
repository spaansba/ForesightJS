import { css, html, LitElement } from "lit"
import { customElement, state } from "lit/decorators.js"
import { virtualize } from "@lit-labs/virtualizer/virtualize.js"

import type {
  CallbackInvokedEvent,
  ElementRegisteredEvent,
  ElementUnregisteredEvent,
} from "js.foresight"
import { ForesightManager, type ForesightElement, type ForesightElementState } from "js.foresight"

type Section = "active" | "inactive"
type ListRow =
  | { kind: "header"; section: Section; count: number }
  | { kind: "element"; element: ForesightElement; state: ForesightElementState }
import { CHEVRON_SVG } from "../../../svg/svg-icons"
import type { SortElementList } from "../../../types/types"
import type { CallbackHits } from "../../../helpers/callbackHits"
import { ForesightDevtools } from "../../foresight-devtools"
import "../base-tab/tab-content"
import "../base-tab/tab-header"
import "../dropdown/single-select-dropdown"
import type { DropdownOption } from "../dropdown/single-select-dropdown"
import "../element-tab/single-element"
import "./reactivate-countdown"

const EMPTY_MESSAGE =
  "Nothing registered yet. Call ForesightManager.instance.register() on an element"

@customElement("element-tab")
export class ElementTab extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* The list scrolls itself: the virtualizer looks up its scroll container
       on connect, before tab-content has rendered the slot it sits in. */
    .list {
      height: 100%;
      scrollbar-width: thin;
      scrollbar-color: var(--fs-line) transparent;
    }

    /* The virtualizer positions rows absolutely, so they need an explicit width. */
    single-element {
      width: 100%;
    }

    .section-header.inactive-header {
      margin-top: 8px;
    }

    .section-header {
      all: unset;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
      height: 22px;
      padding: 0 10px;
      color: var(--fs-muted);
      cursor: pointer;
    }

    .section-header:hover {
      color: var(--fs-text);
    }

    .section-header:focus-visible {
      outline: 1px dashed var(--fs-text);
      outline-offset: -1px;
    }

    .rule {
      flex: 1;
      border-top: 1px dashed var(--fs-line);
    }

    .collapsed .rule {
      border-top-style: solid;
    }

    .section-header svg {
      width: 11px;
      height: 11px;
      transform: rotate(90deg);
      transition: transform 0.12s ease;
    }

    .section-header.collapsed svg {
      transform: none;
    }
  `

  @state() private sortDropdown: DropdownOption[]
  @state() private sortOrder: SortElementList
  @state() private elementListItems: Map<ForesightElement, ForesightElementState> = new Map()
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
  private _documentOrder: ForesightElement[] | null = null

  constructor() {
    super()
    this.sortOrder = ForesightDevtools.instance.devtoolsSettings.sortElementList
    this.sortDropdown = [
      {
        value: "visibility",
        label: "by visibility",
        title: "On-screen elements first, then document order",
      },
      { value: "documentOrder", label: "by document", title: "Top to bottom as in the DOM" },
      {
        value: "insertionOrder",
        label: "by insertion",
        title: "In the order they were registered",
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
      lines.push("Move toward a registered element to see some")
    }

    return lines.join("\n")
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
        this._documentOrder = null
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
        this._elementsCacheDirty = true
        this._documentOrder = null
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
      if (previous?.isParked !== state.isParked) {
        this._documentOrder = null
      }

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
    this._documentOrder = null
  }

  private get documentOrder(): ForesightElement[] {
    if (this._documentOrder) {
      return this._documentOrder
    }

    const unplaced = new Set(this.elementListItems.keys())
    const ordered: ForesightElement[] = []
    for (const node of document.querySelectorAll("*")) {
      if (unplaced.delete(node)) {
        ordered.push(node)
      }
    }
    ordered.push(...unplaced)
    this._documentOrder = ordered

    return ordered
  }

  private getSortedElements(): ForesightElement[] {
    switch (this.sortOrder) {
      case "insertionOrder":
        return [...this.elementListItems.keys()]
      case "documentOrder":
        return this.documentOrder
      case "visibility": {
        const isVisible = (element: ForesightElement) =>
          this.elementListItems.get(element)?.isIntersectingWithViewport === true

        return [
          ...this.documentOrder.filter(isVisible),
          ...this.documentOrder.filter(element => !isVisible(element)),
        ]
      }
      default:
        this.sortOrder satisfies never

        return []
    }
  }

  private _recomputeElementsCache(): void {
    if (!this._elementsCacheDirty) {
      return
    }

    const active: ForesightElement[] = []
    const inactive: ForesightElement[] = []
    for (const element of this.getSortedElements()) {
      // Disabled elements are inactive too; their reason is shown as a badge on the
      // row rather than a separate section.
      if (this.elementListItems.get(element)?.isActive) {
        active.push(element)
      } else {
        inactive.push(element)
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

  private toggleSection(section: Section): void {
    if (section === "active") {
      this.activeSectionCollapsed = !this.activeSectionCollapsed
    } else {
      this.inactiveSectionCollapsed = !this.inactiveSectionCollapsed
    }
  }

  private sectionRows(section: Section, elements: ForesightElement[]): ListRow[] {
    if (elements.length === 0) {
      return []
    }

    const collapsed =
      section === "active" ? this.activeSectionCollapsed : this.inactiveSectionCollapsed
    const rows: ListRow[] = [{ kind: "header", section, count: elements.length }]
    if (collapsed) {
      return rows
    }

    for (const element of elements) {
      const state = this.elementListItems.get(element)
      if (state) {
        rows.push({ kind: "element", element, state })
      }
    }

    return rows
  }

  private renderRow = (row: ListRow) => {
    if (row.kind === "element") {
      return html`
        <single-element
          .element=${row.element}
          .state=${row.state}
          .isExpanded=${this.expandedElementIds.has(row.state.id)}
          .onToggle=${this.handleElementToggle}
        ></single-element>
      `
    }

    const collapsed =
      row.section === "active" ? this.activeSectionCollapsed : this.inactiveSectionCollapsed

    return html`
      <button
        class="section-header ${row.section}-header ${collapsed ? "collapsed" : ""}"
        @click=${() => this.toggleSection(row.section)}
      >
        ${CHEVRON_SVG} ${row.section}<span class="rule"></span>${row.count}
      </button>
    `
  }

  render() {
    const hits = ForesightDevtools.instance.callbackHits

    return html`
      <tab-header>
        <div slot="chips" data-tip="${this._generateHitsChipTitle(hits)}">
          ${hits.total} callbacks fired
        </div>
        <div slot="actions">
          <single-select-dropdown
            .dropdownOptions="${this.sortDropdown}"
            .selectedOptionValue="${this.sortOrder}"
            .onSelectionChange="${this.handleSortChange}"
          ></single-select-dropdown>
        </div>
      </tab-header>
      <tab-content .noContentMessage=${EMPTY_MESSAGE} .hasContent=${!!this.elementListItems.size}>
        <div class="list">
          ${virtualize({
            scroller: true,
            items: [
              ...this.sectionRows("active", this.activeElements),
              ...this.sectionRows("inactive", this.inactiveElements),
            ],
            keyFunction: row => (row.kind === "header" ? row.section : row.state.id),
            renderItem: this.renderRow,
          })}
        </div>
      </tab-content>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "element-tab": ElementTab
  }
}
