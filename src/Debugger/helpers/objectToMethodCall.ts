/**
 * Converts a JavaScript object into a readable method call string format.
 *
 * This utility is designed for copying object configurations and transforming them
 * into method call syntax for easy copy-pasting of global settings or configurations.
 *
 * @template T - The type of the input object, constrained to Record<string, any>
 * @param obj - The object to convert to method call format
 * @param methodName - The name of the method to wrap the object in (e.g., 'ForesightManager.initialize')
 * @returns A formatted string representing the object as a method call with proper indentation
 *
 * @example
 * ```typescript
 * const config = {
 *   debug: true,
 *   settings: { enabled: false }
 * };
 *
 * const result = objectToMethodCall(config, 'MyClass.configure');
 * // Returns:
 * // MyClass.configure({
 * //   debug: true,
 * //   settings: {
 * //     enabled: false
 * //   }
 * // })
 * ```
 */
export function objectToMethodCall<T extends Record<string, any>>(
  obj: T,
  methodName: string
): string {
  const entries = Object.entries(obj) as Array<[keyof T, T[keyof T]]>

  // Filter out deprecated keys
  const filteredEntries = entries.filter(([key]) => {
    const keyStr = String(key)
    if (keyStr === "resizeScrollThrottleDelay") {
      return false
    }
    return true
  })

  const formattedEntries = filteredEntries
    .map(([key, value]) => `  ${String(key)}: ${formatValue(value)}`)
    .join(",\n")

  return `${methodName}({\n${formattedEntries}\n})`
}

/**
 * Formats a value with proper indentation and type-appropriate string representation.
 *
 * @param value - The value to format (can be any type)
 * @param indent - The current indentation level (defaults to 2 spaces)
 * @returns A formatted string representation of the value
 */
const formatValue = (value: unknown, indent: number = 2): string => {
  const spaces = " ".repeat(indent)

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return "{}"

    const formattedEntries = entries
      .map(([key, val]) => `${spaces}  ${key}: ${formatValue(val, indent + 2)}`)
      .join(",\n")

    return `{\n${formattedEntries}\n${spaces}}`
  }

  if (typeof value === "string") return `'${value}'`
  if (typeof value === "boolean" || typeof value === "number") return String(value)
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (Array.isArray(value)) return JSON.stringify(value)

  return String(value)
}
