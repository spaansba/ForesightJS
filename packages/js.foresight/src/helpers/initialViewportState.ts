export function initialViewportState(rect: DOMRect) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  return rect.top < viewportHeight && rect.bottom > 0 && rect.left < viewportWidth && rect.right > 0
}
