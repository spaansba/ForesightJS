import { MinimumConnectionType } from '../types/types'
import { ForesightManager } from "js.foresight"

type ShouldRegister = {
  shouldRegister: boolean
  isTouchDevice: boolean
  isLimitedConnection: boolean
}

export function evaluateRegistrationConditions(): ShouldRegister {
  const isTouchDevice = userUsesTouchDevice()
  const isLimitedConnection = hasConnectionLimitations()
  const shouldRegister = !isLimitedConnection
  return { isTouchDevice, isLimitedConnection, shouldRegister }
}

/**
 * Detects if the current device is likely a touch-enabled device.
 * It checks for coarse pointer media query and the presence of touch points.
 *
 * @returns `true` if the device is likely touch-enabled, `false` otherwise.
 */
export function userUsesTouchDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connection = (navigator as any).connection
  if (!connection) return false

  const minimumConnectionType = ForesightManager.instance.getManagerData.globalSettings.minimumConnectionType

  // Define array of connection types from slowest to fastest
  const connectionTypes: MinimumConnectionType[] = ["slow-2g", "2g", "3g", "4g"]
  // Get index of user's current connection speed in the array (e.g. "4g" would be index 3)
  const currentConnectionIndex = connectionTypes.indexOf(connection.effectiveType as MinimumConnectionType)
  // Get index of the minimum connection speed required in settings (e.g. "3g" would be index 2)
  const minimumConnectionIndex = connectionTypes.indexOf(minimumConnectionType)

  // If user's connection is slower than the minimum required, or data saver is enabled, return true
  return currentConnectionIndex < minimumConnectionIndex || connection.saveData
}
