import type { ForesightElementData } from "../../types/types"
import type { ElementOverlays } from "../ForesightDebugger"

export function updateElementOverlays(
  currentOverlays: ElementOverlays,
  newData: ForesightElementData,
  showNameTags: boolean
) {
  const { linkOverlay, expandedOverlay, nameLabel } = currentOverlays
  const rect = newData.elementBounds.expandedRect
  //TODO REFACTOR

  linkOverlay.style.left = `${rect.left}px`
  linkOverlay.style.top = `${rect.top}px`
  linkOverlay.style.width = `${rect.right - rect.left}px`
  linkOverlay.style.height = `${rect.bottom - rect.top}px`
  linkOverlay.classList.toggle("trajectory-hit", newData.trajectoryHitData.isTrajectoryHit)
  linkOverlay.classList.toggle("active", newData.isHovering)

  if (newData.elementBounds.expandedRect) {
    expandedOverlay.style.left = `${newData.elementBounds.expandedRect.left}px`
    expandedOverlay.style.top = `${newData.elementBounds.expandedRect.top}px`
    expandedOverlay.style.width = `${
      newData.elementBounds.expandedRect.right - newData.elementBounds.expandedRect.left
    }px`
    expandedOverlay.style.height = `${
      newData.elementBounds.expandedRect.bottom - newData.elementBounds.expandedRect.top
    }px`
    expandedOverlay.style.display = "block"
  } else {
    expandedOverlay.style.display = "none"
  }

  nameLabel.textContent = newData.name
  nameLabel.style.left = `${rect.left}px`
  nameLabel.style.top = `${rect.top - nameLabel.offsetHeight}px` // Position above the element (adjusted for new padding)
  if (newData.name === "" || !showNameTags) {
    nameLabel.style.display = "none"
  } else {
    nameLabel.style.display = "block"
  }
}
