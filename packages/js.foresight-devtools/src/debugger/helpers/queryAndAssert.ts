/**
 * Finds an element, logs an error to the console if not found,
 * and returns the element or null.
 * @param selector The CSS selector for the element.
 * @returns The found element of type T, or null.
 */
export function queryAndAssert<T extends Element>(
  selector: string,
  queryContainer: HTMLElement | null
): T | null {
  if (!queryContainer) {
    console.error("Component warning: Query container coudn't be found")
    return null
  }
  const element = queryContainer.querySelector<T>(selector)
  if (!element) {
    console.error(
      `Component setup failed: A required element with selector "${selector}" was not found in the container.`
    )
  }
  return element
}

/**
 * Finds all elements matching a selector, logs an error if none are found,
 * and returns the resulting NodeList.
 * @param selector The CSS selector for the elements.
 * @param queryContainer The parent element to search within.
 * @returns A NodeList of the found elements (which will be empty if none are found).
 */
export function queryAllAndAssert<T extends Element>(
  selector: string,
  queryContainer: HTMLElement | null
): NodeListOf<T> | null {
  if (!queryContainer) {
    console.error("Component warning: Query container coudn't be found")
    return null
  }
  const elements = queryContainer.querySelectorAll<T>(selector)

  // The "failure" condition for querySelectorAll is an empty list.
  if (elements.length === 0) {
    console.error(
      `Component Warning: No elements matching selector "${selector}" were found in the container.`
    )
  }

  // Always return the NodeList, even if it's empty.
  return elements
}
