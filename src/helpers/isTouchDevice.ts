/**
 * Detects if the current device is likely a touch-enabled device.
 * It checks for coarse pointer media query and the presence of touch points.
 *
 * @returns `true` if the device is likely touch-enabled, `false` otherwise.
 */
export const isTouchDevice = () => {
  return window.matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0
}
