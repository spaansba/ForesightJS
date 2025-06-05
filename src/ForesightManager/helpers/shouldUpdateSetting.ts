/**
 * Checks if a setting should be updated.
 * Returns true if the newValue is defined and different from the currentValue.
 * Uses a type predicate to narrow the type of newValue in the calling scope.
 *
 * @param newValue The potentially new value for the setting (can be undefined).
 * @param currentValue The current value of the setting.
 * @returns True if the setting should be updated, false otherwise.
 */
export function shouldUpdateSetting<T>(
  newValue: T | undefined,
  currentValue: T
): newValue is NonNullable<T> {
  // NonNullable<T> ensures that if T itself could be undefined (e.g. T = number | undefined),
  // the predicate narrows to the non-undefined part (e.g. number).
  // If T is already non-nullable (e.g. T = number), it remains T (e.g. number).
  return newValue !== undefined && currentValue !== newValue
}
