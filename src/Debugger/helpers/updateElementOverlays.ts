// helpers/updateElementOverlays.ts

import type { ForesightElementData } from "../../types/types"
import type { ElementOverlays } from "../ForesightDebugger"

export function updateElementOverlays(
  currentOverlays: ElementOverlays,
  newData: ForesightElementData,
  showNameTags: boolean
) {
  const { expandedOverlay, nameLabel } = currentOverlays
  const { expandedRect } = newData.elementBounds

  const expandedWidth = expandedRect.right - expandedRect.left
  const expandedHeight = expandedRect.bottom - expandedRect.top
  expandedOverlay.style.width = `${expandedWidth}px`
  expandedOverlay.style.height = `${expandedHeight}px`
  expandedOverlay.style.transform = `translate(${expandedRect.left}px, ${expandedRect.top}px)`
  expandedOverlay.style.display = "block"

  nameLabel.textContent = newData.name
  if (newData.name === "" || !showNameTags) {
    nameLabel.style.display = "none"
  } else {
    nameLabel.style.display = "block"
    nameLabel.style.transform = `translate(${expandedRect.left}px, ${expandedRect.top - 25}px)`
  }
}
