export function clampNumber(number: number, lowerBound: number, upperBound: number) {
  return Math.min(Math.max(number, lowerBound), upperBound)
}
