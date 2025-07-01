export function shouldUpdateSetting<T>(newValue: T | undefined, currentValue: T): boolean {
  return newValue !== undefined && newValue !== currentValue
}
