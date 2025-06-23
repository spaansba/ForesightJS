type ShouldRegister = {
  shouldRegister: boolean
  isTouchDevice: boolean
  isLimitedConnection: boolean
}

export function evaluateRegistrationConditions(): ShouldRegister {
  const isTouchDevice = userUsesTouchDevice()
  const isLimitedConnection = hasConnectionLimitations()
  const shouldRegister = !isTouchDevice && !isLimitedConnection
  return { isTouchDevice, isLimitedConnection, shouldRegister }
}

/**
 * Detects if the current device is likely a touch-enabled device.
 * It checks for coarse pointer media query and the presence of touch points.
 *
 * @returns `true` if the device is likely touch-enabled, `false` otherwise.
 */
function userUsesTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0
}

/**
 * Checks if the user has connection limitations (slow network or data saver enabled).
 *
 * @returns {boolean} True if connection is limited, false if safe to prefetch
 * @example
 * if (!hasConnectionLimitations()) {
 *   prefetchResource('/api/data');
 * }
 */
function hasConnectionLimitations(): boolean {
  const connection = (navigator as any).connection
  if (!connection) return false

  return /2g/.test(connection.effectiveType) || connection.saveData
}
