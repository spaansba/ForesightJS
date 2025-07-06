/**
 * Converts a camelCase or PascalCase string into a human-readable string
 * with spaces.
 * e.g., "documentOrder" -> "Document Order"
 * e.g., "visibility" -> "Visibility"
 * @param text The camelCase or PascalCase string to format.
 * @returns A formatted string with spaces and capitalized first letter.
 */
export function formatToSpacedWords(text: string): string {
  // Return an empty string if the input is null, undefined, or empty.
  if (!text) {
    return ""
  }

  // Step 1: Use a regular expression to find all uppercase letters (A-Z)
  // and insert a space before each one. The 'g' flag ensures it replaces all
  // occurrences, not just the first.
  // "documentOrder" -> "document Order"
  // "Visibility" -> " Visibility" (note the leading space)
  const resultWithSpaces = text.replace(/([A-Z])/g, " $1")

  // Step 2: Capitalize the first character of the result and concatenate
  // the rest of the string. The trim() method removes any leading space
  // that might have been added in Step 1 (for inputs like "Visibility").
  const finalResult = resultWithSpaces.trim()
  return finalResult.charAt(0).toUpperCase() + finalResult.slice(1)
}
