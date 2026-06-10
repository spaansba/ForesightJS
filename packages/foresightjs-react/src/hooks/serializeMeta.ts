/**
 * Serialize `meta` for use as an effect dependency / patch key so a change to
 * its contents re-triggers the patch effect. Depending on the object itself
 * would compare by identity, re-firing the effect for every inline `meta={{...}}`
 * even when its contents are unchanged. Falls back to String() when the object
 * can't be serialized (e.g. circular references).
 */
export const serializeMeta = (meta: Record<string, unknown> | undefined): string => {
  if (!meta) {
    return ""
  }

  try {
    return JSON.stringify(meta)
  } catch {
    return String(meta)
  }
}
