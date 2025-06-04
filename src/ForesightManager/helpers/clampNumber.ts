export function clampNumber(
  number: number,
  lowerBound: number,
  upperBound: number,
  isDebug: boolean,
  settingName: string
) {
  if (isDebug) {
    if (number < lowerBound) {
      console.warn(
        `ForesightJS: "${settingName}" value ${number} is below minimum bound ${lowerBound}, clamping to ${lowerBound}`
      )
    } else if (number > upperBound) {
      console.warn(
        `ForesightJS: "${settingName}" value ${number} is above maximum bound ${upperBound}, clamping to ${upperBound}`
      )
    }
  }

  return Math.min(Math.max(number, lowerBound), upperBound)
}
