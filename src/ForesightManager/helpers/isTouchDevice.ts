export const isTouchDevice = () => {
  return window.matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0
}
