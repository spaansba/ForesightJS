import type { ForesightElementData, ForesightElement, ForesightManager } from "js.foresight"
import { BaseTab } from "../baseTab/BaseTab"
import type { SortElementList } from "../../types/types"
import { getIntersectingIcon } from "./helpers/getIntersectingIcon"
import { sortByDocumentPosition } from "./helpers/sortByDocumentPosition"
import type { ForesightDebugger } from "../../debugger/ForesightDebugger"
import { queryAllAndAssert, queryAndAssert } from "../../debugger/helpers/queryAndAssert"
import { formatToSpacedWords } from "../../debugger/helpers/formatToSpacedWords"

export class ControlPanelElementTab extends BaseTab {
  // DOM Elements
  private elementListItemsContainer: HTMLElement | null = null
  // private elementCountSpan: HTMLSpanElement
  private elementListItems: Map<ForesightElement, HTMLElement> = new Map()
  private sortButton: HTMLButtonElement | null = null
  private sortDropdown: HTMLDivElement | null = null
  constructor(
    foresightManager: ForesightManager,
    debuggerInstance: ForesightDebugger,
    controlsContainer: HTMLDivElement
  ) {
    super(foresightManager, debuggerInstance, controlsContainer)
    this.queryDOMElements()
    this.setupEventListeners()
  }

  protected queryDOMElements() {
    this.sortButton = queryAndAssert<HTMLButtonElement>(
      "#sort-elements-button",
      this.controlsContainer
    )
    this.sortDropdown = queryAndAssert<HTMLDivElement>(
      "#sort-options-dropdown",
      this.controlsContainer
    )
    this.elementListItemsContainer = queryAndAssert<HTMLButtonElement>(
      "#element-list-items-container",
      this.controlsContainer
    )
  }

  protected setupEventListeners() {
    this.sortButton?.addEventListener("click", e => {
      e.stopPropagation()
      this.sortDropdown?.classList.toggle("active")
    })

    this.sortDropdown?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      const selectedSortButton = target.closest("[data-sort]") as HTMLElement | null
      if (!selectedSortButton) return

      const value = selectedSortButton.dataset.sort as SortElementList
      this.debuggerInstance.alterDebuggerSettings({
        sortElementList: value,
      })
      this.reorderElementsInListContainer(this.sortElementsInListContainer())
      this.updateSortOptionUI(value)
      this.sortDropdown?.classList.remove("active")
    })
  }

  public addElementToListContainer(elementData: ForesightElementData) {
    if (!this.elementListItemsContainer) return
    if (this.elementListItemsContainer.classList.contains("no-items")) {
      this.elementListItemsContainer.innerHTML = ""
      this.elementListItemsContainer.classList.remove("no-items")
    }
    if (this.elementListItems.has(elementData.element)) return
    const listItem = document.createElement("div")
    listItem.className = "element-list-item"
    this.updateListItemContent(listItem, elementData)
    this.elementListItemsContainer.appendChild(listItem)
    this.elementListItems.set(elementData.element, listItem)
  }

  public removeElementFromListContainer(elementData: ForesightElementData) {
    if (!this.elementListItemsContainer) return
    const listItem = this.elementListItems.get(elementData.element)
    if (!listItem) {
      return
    }
    listItem.remove()
    this.elementListItems.delete(elementData.element)
    if (this.elementListItems.size === 0) {
      this.elementListItemsContainer.innerHTML = ""
      this.elementListItemsContainer.classList.add("no-items")
      this.elementListItemsContainer.textContent =
        "No elements registered, all callbacks have been hit."
    }
  }

  public updateElementVisibilityStatus(elementData: ForesightElementData) {
    if (!this.elementListItemsContainer) return
    const listItem = this.elementListItems.get(elementData.element)
    if (!listItem) {
      this.addElementToListContainer(elementData)
      return
    }

    listItem.classList.toggle("not-in-viewport", !elementData.isIntersectingWithViewport)
    const intersectingElement = listItem.querySelector(".intersecting-indicator")
    if (intersectingElement) {
      const intersectingIcon = getIntersectingIcon(elementData.isIntersectingWithViewport)
      intersectingElement.textContent = intersectingIcon
    }
    this.reorderElementsInListContainer(this.sortElementsInListContainer())
  }

  public sortElementsInListContainer(elementData?: ForesightElementData): ForesightElementData[] {
    const sortOrder = this.debuggerInstance.getDebuggerData.settings.sortElementList
    const elementsData = Array.from(this.foresightManagerInstance.registeredElements.values())
    switch (sortOrder) {
      case "insertionOrder":
        //default behaviour of adding elements to the registered elements map.
        break
      case "documentOrder":
        // based on the elements place in the document
        elementsData.sort(sortByDocumentPosition)
        break
      case "visibility":
        // based on if the element is visible or not (visible at the top)
        elementsData.sort((a: ForesightElementData, b: ForesightElementData) => {
          if (a.isIntersectingWithViewport !== b.isIntersectingWithViewport) {
            return a.isIntersectingWithViewport ? -1 : 1
          }
          return sortByDocumentPosition(a, b)
        })
        break
      default:
        const _exhaustiveCheck: never = sortOrder
        throw new Error(`Unhandled sort order: ${_exhaustiveCheck}`)
    }
    return elementsData
  }

  public setVisibilityChip(total: number, intersecting: number) {
    const visibleChip = queryAndAssert('[data-dynamic="elements-visible"]', this.controlsContainer)
    if (visibleChip) {
      visibleChip.textContent = `${intersecting}/${total} visible`
      visibleChip.setAttribute("title", "Elements visible in viewport vs total registered elements")
    }
  }

  public refreshHitsChip() {
    const {
      tab,
      mouse,
      scroll,
      total: totalHits,
    } = this.foresightManagerInstance.getManagerData.globalCallbackHits
    const hitsChip = this.controlsContainer.querySelector('[data-dynamic="elements-hits"]')
    if (hitsChip) {
      hitsChip.textContent = `${totalHits} hits`
      hitsChip.setAttribute(
        "title",
        `Total callback hits breakdown:

Mouse: ${mouse.hover + mouse.trajectory}
  • hover: ${mouse.hover}
  • trajectory: ${mouse.trajectory}

Tab: ${tab.forwards + tab.reverse}
  • forwards: ${tab.forwards}
  • reverse: ${tab.reverse}

Scroll: ${scroll.down + scroll.left + scroll.right + scroll.up}
  • down: ${scroll.down}
  • up: ${scroll.up}
  • left: ${scroll.left}
  • right: ${scroll.right}`
      )
    }
  }

  public reorderElementsInListContainer(sortedElements: ForesightElementData[]) {
    if (!this.elementListItemsContainer) return

    const fragment = document.createDocumentFragment()

    if (sortedElements.length) {
      sortedElements.forEach(elementData => {
        const listItem = this.elementListItems.get(elementData.element)
        if (listItem) {
          // Appending to the fragment is cheap (it's off-screen)
          fragment.appendChild(listItem)
        }
      })
      this.elementListItemsContainer.innerHTML = ""

      this.elementListItemsContainer.appendChild(fragment)
    }
  }

  private updateListItemContent(listItem: HTMLElement, elementData: ForesightElementData) {
    // Determine the viewport icon based on current visibility status
    const intersectingIcon = getIntersectingIcon(elementData.isIntersectingWithViewport)
    listItem.classList.toggle("not-in-viewport", !elementData.isIntersectingWithViewport)

    let hitSlopText = "N/A"

    if (elementData.elementBounds.hitSlop) {
      const { top, right, bottom, left } = elementData.elementBounds.hitSlop
      hitSlopText = `T:${top} R:${right} B:${bottom} L:${left}`
    }

    // Create comprehensive title with all information
    const comprehensiveTitle = [
      `${elementData.name || "Unnamed"}`,
      "------------------------------------------------------------",
      "Viewport Status:",
      elementData.isIntersectingWithViewport
        ? "   - In viewport - actively tracked by observers"
        : "   - Not in viewport - not being tracked",
      "",
      "Hit Slop:",
      elementData.elementBounds.hitSlop
        ? [
            `     Top: ${elementData.elementBounds.hitSlop.top}px, Bottom: ${elementData.elementBounds.hitSlop.bottom}px `,
            `     Right: ${elementData.elementBounds.hitSlop.right}px, Left: ${elementData.elementBounds.hitSlop.left}px`,
          ].join("\n")
        : "   • Not defined - using element's natural boundaries",
      "",
    ].join("\n")

    listItem.title = comprehensiveTitle

    listItem.innerHTML = `
    <span class="intersecting-indicator">${intersectingIcon}</span>
    <span class="element-name">${elementData.name || "Unnamed"}</span>
    <span class="hit-slop">${hitSlopText}</span>
  `
  }

  public updateSortOptionUI(currentSort: SortElementList) {
    const buttons = queryAllAndAssert("[data-sort]", this.sortDropdown)
    buttons?.forEach(button => {
      const sortValue = (button as HTMLElement).dataset.sort!
      button.classList.toggle("active", sortValue === currentSort)
    })

    // Update sort method
    const sortChip = queryAndAssert('[data-dynamic="elements-sort"]', this.controlsContainer)
    if (sortChip) {
      sortChip.textContent = `▼ ${formatToSpacedWords(currentSort)}`
      sortChip.setAttribute(
        "title",
        `Current element sorting method: ${formatToSpacedWords(currentSort)}`
      )
    }
  }

  public cleanup() {
    // this.elementListItemsContainer = null
    // this.elementCountSpan = null
    this.elementListItems.clear()
    // this.sortDropdown = null
    // this.sortButton = null
  }
}
