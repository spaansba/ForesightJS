/**
 * Serialize an object option (`meta`, `hitSlop`) for use as an effect
 * dependency / patch key so a change to its contents re-triggers the patch
 * effect. Depending on the object itself would compare by identity, re-firing
 * the effect for every inline `meta={{...}}` even when its contents are
 * unchanged. Falls back to String() when the object can't be serialized
 * (e.g. circular references).
 */
export const serializeOption = (value: unknown): string => {
  if (value === undefined || value === null) {
    return ""
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
