import { ForesightManager } from "js.foresight"
import type { ForesightElementData, ForesightElement } from "js.foresight"
import type { SortElementList } from "../types/types"

import { getIntersectingIcon } from "../helpers/getIntersectingIcon"
import type { ForesightDebugger } from "../debugger/foresightDebugger"
import { sortByDocumentPosition } from "../helpers/sortByDocumentPosition"

const NO_ELEMENTS_STRING = "<em>No elements registered.</em>"

export class ControlPanelElementList {
  private foresightManagerInstance: ForesightManager
  private debuggerInstance: ForesightDebugger

  // DOM Elements
  private elementListItemsContainer: HTMLElement | null = null
  private elementCountSpan: HTMLSpanElement | null = null
  private callbackCountSpan: HTMLSpanElement | null = null
  private elementListItems: Map<ForesightElement, HTMLElement> = new Map()
  private sortOptionsPopup: HTMLDivElement | null = null
  private sortButton: HTMLButtonElement | null = null

  // Event handler references for cleanup
  private closeSortDropdownHandler: ((e: MouseEvent) => void) | null = null

  constructor(foresightManager: ForesightManager, debuggerInstance: ForesightDebugger) {
    this.foresightManagerInstance = foresightManager
    this.debuggerInstance = debuggerInstance
  }

  public initialize(controlsContainer: HTMLElement) {
    this.queryDOMElements(controlsContainer)
    this.setupEventListeners()
  }

  private queryDOMElements(controlsContainer: HTMLElement) {
    this.elementListItemsContainer = controlsContainer.querySelector(
      "#element-list-items-container"
    )
    this.elementCountSpan = controlsContainer.querySelector("#element-count")
    this.callbackCountSpan = controlsContainer.querySelector("#callback-count")
    this.sortOptionsPopup = controlsContainer.querySelector("#sort-options-popup")
    this.sortButton = controlsContainer.querySelector(".sort-button")
  }

  private setupEventListeners() {
    this.sortButton?.addEventListener("click", e => {
      e.stopPropagation()
      this.sortOptionsPopup?.classList.toggle("active")
    })

    this.sortOptionsPopup?.addEventListener("click", e => {
      const target = e.target as HTMLElement
      const sortButton = target.closest("[data-sort]") as HTMLElement | null
      if (!sortButton) return

      const value = sortButton.dataset.sort as SortElementList
      this.debuggerInstance.alterDebuggerSettings({
        sortElementList: value,
      })
      this.reorderElementsInListContainer(this.sortElementsInListContainer())
      this.updateSortOptionUI(value)
      this.sortOptionsPopup?.classList.remove("active")
    })

    this.closeSortDropdownHandler = (e: MouseEvent) => {
      if (
        this.sortOptionsPopup?.classList.contains("active") &&
        !this.sortButton?.contains(e.target as Node)
      ) {
        this.sortOptionsPopup.classList.remove("active")
      }
    }
    document.addEventListener("click", this.closeSortDropdownHandler)
  }

  public updateElementCountsDisplay() {
    if (!this.elementCountSpan) return
    const registeredElements = Array.from(
      this.foresightManagerInstance.registeredElements.entries()
    )
    const total = registeredElements.length
    const isIntersecting = registeredElements.filter(
      ([_, elementData]) => elementData.isIntersectingWithViewport
    ).length
    const visibleTitle = [
      "Element Visibility Status",
      "-----------------------------------------------------",
      `Visible in Viewport: ${isIntersecting}`,
      `Not in Viewport: ${total - isIntersecting}`,
      `Total Registered Elements: ${total}`,
      "",
      "Note: Only elements visible in the viewport",
      "are actively tracked by intersection observers.",
    ]
    this.elementCountSpan.textContent = `Visible: ${isIntersecting}/${total} ~ `
    this.elementCountSpan.title = visibleTitle.join("\n")
  }

  public updateCallbackCountsDisplay() {
    if (!this.callbackCountSpan) return

    const { tab, mouse, scroll, total } =
      this.foresightManagerInstance.getManagerData.globalCallbackHits
    this.callbackCountSpan.textContent = `Mouse: ${mouse.hover + mouse.trajectory} Tab: ${
      tab.forwards + tab.reverse
    } Scroll: ${scroll.down + scroll.left + scroll.right + scroll.up}`
    this.callbackCountSpan.title = [
      "Callback Execution Stats",
      "--------------------------------------------",
      "Mouse Callbacks",
      `   " Trajectory: ${mouse.trajectory}`,
      `   " Hover: ${mouse.hover}`,
      `   " Subtotal: ${mouse.hover + mouse.trajectory}`,
      "",
      "Keyboard Callbacks:",
      `   " Tab Forward: ${tab.forwards}`,
      `   " Tab Reverse: ${tab.reverse}`,
      `   " Subtotal: ${tab.forwards + tab.reverse}`,
      "",
      "Scroll Callbacks:",
      `   " Up: ${scroll.up} | Down: ${scroll.down}`,
      `   " Left: ${scroll.left} | Right: ${scroll.right}`,
      `   " Subtotal: ${scroll.up + scroll.down + scroll.left + scroll.right}`,
      "",
      "Total Callbacks: " + total,
    ].join("\n")
  }

  public removeElementFromListContainer(elementData: ForesightElementData) {
    if (!this.elementListItemsContainer) return
    const listItem = this.elementListItems.get(elementData.element)
    if (!listItem) {
      return
    }
    listItem.remove()
    this.elementListItems.delete(elementData.element)
    this.updateElementCountsDisplay()
    this.updateCallbackCountsDisplay()
    if (this.elementListItems.size === 0) {
      this.elementListItemsContainer.innerHTML = NO_ELEMENTS_STRING
    }
  }

  public updateElementVisibilityStatus(elementData: ForesightElementData) {
    if (!this.elementListItemsContainer) return
    const listItem = this.elementListItems.get(elementData.element)
    if (!listItem) {
      this.addElementToList(elementData)
      return
    }

    listItem.classList.toggle("not-in-viewport", !elementData.isIntersectingWithViewport)
    const intersectingElement = listItem.querySelector(".intersecting-indicator")
    if (intersectingElement) {
      const intersectingIcon = getIntersectingIcon(elementData.isIntersectingWithViewport)
      intersectingElement.textContent = intersectingIcon
    }
    this.updateElementCountsDisplay()
    this.reorderElementsInListContainer(this.sortElementsInListContainer())
  }

  private sortedElementList: ForesightElementData[] = []
  private sortElementsInListContainer(elementData?: ForesightElementData): ForesightElementData[] {
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
        elementsData.sort((a, b) => {
          if (a.isIntersectingWithViewport !== b.isIntersectingWithViewport) {
            return a.isIntersectingWithViewport ? -1 : 1
          }
          return sortByDocumentPosition(a, b)
        })
        break
      default:
        sortOrder satisfies never
    }
    return elementsData
  }

  private reorderElementsInListContainer(sortedElements: ForesightElementData[]) {
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

  public addElementToList(elementData: ForesightElementData) {
    if (!this.elementListItemsContainer) return
    if (this.elementListItemsContainer.innerHTML === NO_ELEMENTS_STRING) {
      this.elementListItemsContainer.innerHTML = ""
    }
    if (this.elementListItems.has(elementData.element)) return
    const listItem = document.createElement("div")
    listItem.className = "element-list-item"
    this.updateListItemContent(listItem, elementData)
    this.elementListItemsContainer!.appendChild(listItem)
    this.elementListItems.set(elementData.element, listItem)
    this.updateElementCountsDisplay()
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
      `${elementData.name || "Unnamed Element"}`,
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
    <span class="element-name">${elementData.name || "Unnamed Element"}</span>
    <span class="hit-slop">${hitSlopText}</span>
  `
  }

  public updateSortOptionUI(currentSort: SortElementList) {
    this.sortOptionsPopup?.querySelectorAll("[data-sort]").forEach(button => {
      const btn = button as HTMLElement
      if (btn.dataset.sort === currentSort) {
        btn.classList.add("active-sort-option")
      } else {
        btn.classList.remove("active-sort-option")
      }
    })
  }

  public cleanup() {
    if (this.closeSortDropdownHandler) {
      document.removeEventListener("click", this.closeSortDropdownHandler)
      this.closeSortDropdownHandler = null
    }

    this.elementListItemsContainer = null
    this.elementCountSpan = null
    this.callbackCountSpan = null
    this.elementListItems.clear()
    this.sortOptionsPopup = null
    this.sortButton = null
  }
}
